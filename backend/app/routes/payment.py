from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse, RedirectResponse
import logging
from typing import Dict, Any
import uuid
from datetime import datetime
import json

from ..models.payment import (
    PaymentInitRequest,
    PaymentVerifyRequest,
    PaymentResponse,
    TransactionRecord
)
from ..services.paystack_service import paystack_service
from ..services.investors import InvestorService  # Import InvestorService
from ..services.transaction_service import TransactionService
from ..core.config import settings

router = APIRouter(prefix="/payments", tags=["payments"])

logger = logging.getLogger(__name__)

# In-memory storage for pending investors (in production, use Redis or database)
pending_investors = {}

@router.post("/initialize", response_model=PaymentResponse)
async def initialize_payment(payment_request: PaymentInitRequest):
    """
    Initialize a payment transaction
    """
    try:
        # Log incoming request for debugging
        logger.debug("Initialize payment request received: %s", payment_request.dict())
        # Convert amount from Naira to Kobo
        amount_in_kobo = int(payment_request.amount * 100)

        # Generate unique reference
        reference = f"INCAP-{uuid.uuid4().hex[:12].upper()}"

        # Prepare metadata
        metadata = payment_request.metadata or {}
        metadata.update({
            "portfolio_type": payment_request.portfolio_type,
            "timestamp": datetime.utcnow().isoformat()
        })

        # If investor data is provided, store it temporarily
        if payment_request.investor_data:
            pending_investors[reference] = {
                "investor_data": payment_request.investor_data,
                "amount": payment_request.amount,
                "portfolio_type": payment_request.portfolio_type,
                "email": payment_request.email,
                "created_at": datetime.utcnow()
            }

        # Initialize transaction with Paystack
        result = paystack_service.initialize_transaction(
            email=payment_request.email,
            amount=amount_in_kobo,
            metadata=metadata,
            callback_url=payment_request.callback_url or f"{settings.BACKEND_URL}/api/v1/payments/callback",
            reference=reference
        )
        # Log paystack response for debugging
        logger.debug("Paystack initialize result for reference %s: %s", reference, result)

        if not result.get('status'):
            # Clean up pending investor data if payment initialization fails
            if reference in pending_investors:
                del pending_investors[reference]
            # Log the failure with details so we can trace the source
            logger.error("Payment initialization failed for reference %s: %s; request=%s", reference, result.get('message'), payment_request.dict())
            raise HTTPException(status_code=400, detail=result.get('message', 'Failed to initialize payment'))

        return PaymentResponse(
            status=True,
            message="Payment initialized successfully",
            data=result['data']
        )

    except HTTPException:
        # Re-raise known HTTP errors
        raise
    except Exception as e:
        logger.exception("Unexpected error initializing payment: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Failed to initialize payment: {str(e)}")

@router.post("/verify", response_model=PaymentResponse)
async def verify_payment(verify_request: PaymentVerifyRequest):
    """
    Verify a payment transaction and create investor record if successful
    """
    try:
        result = paystack_service.verify_transaction(verify_request.reference)

        if not result['status']:
            raise HTTPException(status_code=400, detail=result['message'])

        transaction_data = result['data']

        # Check if this transaction has associated investor data
        if verify_request.reference in pending_investors:
            investor_info = pending_investors[verify_request.reference]

            # Only create investor if payment was successful
            if transaction_data['status'] == 'success':
                try:
                    # Create investor service
                    investor_service = InvestorService()

                    # Ensure supabase client is initialized
                    if investor_service.supabase is None:
                        raise HTTPException(status_code=500, detail="Supabase client not initialized")

                    # Merge investor data with payment info
                    investor_data = investor_info["investor_data"].copy()
                    investor_data["amount"] = investor_info["amount"]
                    investor_data["selectedInvestment"] = investor_info["portfolio_type"]

                    # Create investor record
                    investor_result = investor_service.create_investor(investor_data)

                    if investor_result["success"]:
                        # Add paystack reference to investor record
                        investor_record = investor_result["data"]
                        # Update investor with payment reference
                        update_result = investor_service.supabase.table('investors').update({
                            'paystack_reference': verify_request.reference,
                            'payment_status': 'completed'
                        }).eq('id', investor_record['id']).execute()

                        # Clean up pending investor data
                        del pending_investors[verify_request.reference]

                        return PaymentResponse(
                            status=True,
                            message="Transaction verified and investor record created successfully",
                            data={
                                "transaction": transaction_data,
                                "investor": investor_record
                            }
                        )
                    else:
                        raise HTTPException(status_code=500, detail=f"Failed to create investor record: {investor_result['error']}")
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Failed to create investor record: {str(e)}")
            else:
                # Payment failed, clean up pending investor data
                if verify_request.reference in pending_investors:
                    del pending_investors[verify_request.reference]

                return PaymentResponse(
                    status=False,
                    message="Payment verification failed",
                    data=transaction_data
                )
        else:
            # No investor data associated, record as a standalone paystack transaction
            try:
                transaction_service = TransactionService()
                transaction_result = transaction_service.record_paystack_transaction(transaction_data)
                if not transaction_result['success']:
                    logger.warning(f"Failed to record standalone paystack transaction: {transaction_result['error']}")
            except Exception as e:
                logger.warning(f"Error recording standalone paystack transaction: {str(e)}")

            return PaymentResponse(
                status=True,
                message="Transaction verified successfully",
                data=transaction_data
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify payment: {str(e)}")

@router.get("/callback")
async def payment_callback(request: Request, reference: str):
    """
    Handle Paystack payment callback
    """
    try:
        # Verify the transaction
        result = paystack_service.verify_transaction(reference)

        if result['status'] and result['data']['status'] == 'success':
            # Check if this transaction has associated investor data
            investor_created = False
            session_token = None
            if reference in pending_investors:
                investor_info = pending_investors[reference]

                try:
                    # Create investor service
                    investor_service = InvestorService()

                    # Ensure supabase client is initialized
                    if investor_service.supabase is None:
                        raise Exception("Supabase client not initialized")

                    # Merge investor data with payment info
                    investor_data = investor_info["investor_data"].copy()
                    investor_data["amount"] = investor_info["amount"]
                    investor_data["selectedInvestment"] = investor_info["portfolio_type"]

                    # Create investor record
                    investor_result = investor_service.create_investor(investor_data)

                    if investor_result["success"]:
                        # Add paystack reference to investor record
                        investor_record = investor_result["data"]
                        # Update investor with payment reference
                        update_result = investor_service.supabase.table('investors').update({
                            'paystack_reference': reference,
                            'payment_status': 'completed'
                        }).eq('id', investor_record['id']).execute()

                        investor_created = True

                        # For initial deposits, create a session to log the user in
                        try:
                            # Get user by email to check if user exists
                            user_response = investor_service.supabase.table('users').select('*').eq('email', investor_info["email"]).execute()
                            user_data = getattr(user_response, 'data', [])

                            if user_data and len(user_data) > 0:
                                user = user_data[0]
                                # Create session token
                                from ..routes.auth import create_session_token
                                import uuid
                                from datetime import datetime, timedelta

                                session_token = create_session_token()
                                session_data = {
                                    'user_id': user['id'],
                                    'token': session_token,
                                    'created_at': datetime.now().isoformat(),
                                    'expires_at': (datetime.now() + timedelta(hours=6)).isoformat()
                                }
                                investor_service.supabase.table('sessions').insert(session_data).execute()
                        except Exception as session_error:
                            print(f"Warning: Failed to create session for user after successful payment: {str(session_error)}")
                            session_token = None

                        # Clean up pending investor data
                        del pending_investors[reference]

                except Exception as e:
                    # Log error but still redirect (investor can be created manually)
                    print(f"Error creating investor record: {str(e)}")

            # Redirect to success page with session token if created
            redirect_url = f"{settings.FRONTEND_URL}/dashboard?payment=success"
            if session_token:
                redirect_url += f"&session_token={session_token}"

            return RedirectResponse(url=redirect_url)
        else:
            # Clean up pending investor data on failure
            if reference in pending_investors:
                del pending_investors[reference]

            return RedirectResponse(url=f"{settings.FRONTEND_URL}/dashboard?payment=failed")

    except Exception as e:
        # Clean up pending investor data on error
        if reference in pending_investors:
            del pending_investors[reference]

        return JSONResponse({
            "status": "error",
            "message": str(e),
            "redirect_url": f"{settings.BACKEND_URL}/dashboard?payment=error"
        })

@router.get("/transactions")
async def list_transactions(page: int = 1, per_page: int = 50):
    """
    List all transactions (admin only)
    """
    try:
        result = paystack_service.list_transactions(page=page, per_page=per_page)

        if not result['status']:
            raise HTTPException(status_code=400, detail=result['message'])

        return PaymentResponse(
            status=True,
            message="Transactions retrieved successfully",
            data=result['data']
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve transactions: {str(e)}")

@router.get("/config")
async def get_paystack_config():
    """
    Get Paystack public configuration
    """
    return {
        "public_key": settings.PAYSTACK_PUBLIC_KEY,
        "callback_url": f"{settings.BACKEND_URL}/api/v1/payments/callback"
    }

# Helper endpoint to check pending investors (for debugging)
@router.get("/pending-investors")
async def get_pending_investors():
    """
    Get list of pending investors (for debugging purposes)
    """
    return {
        "count": len(pending_investors),
        "references": list(pending_investors.keys())
    }
