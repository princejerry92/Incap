import logging
from fastapi import APIRouter, HTTPException, Header, Request
from typing import Dict, Any, Optional
from pydantic import BaseModel
from ..services.topup_service import TopUpService
from ..services.dashboard import DashboardService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/topup", tags=["topup"])

class TopUpRequest(BaseModel):
    amount: float

@router.post("/initiate")
async def initiate_topup(
    topup_data: TopUpRequest,
    authorization: str = Header(None)
) -> Dict[str, Any]:
    """Initiate a top-up request"""
    logger.info(f"Top-up initiate request received - amount: {topup_data.amount}")

    if not authorization:
        logger.warning("Top-up initiate failed: Authorization header missing")
        raise HTTPException(status_code=401, detail="Authorization header required")

    try:
        # Extract token and validate user
        session_token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        logger.debug(f"Extracted session token: {session_token[:10]}...")

        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)

        if not user:
            logger.warning(f"Top-up initiate failed: Invalid or expired session token: {session_token[:10]}...")
            raise HTTPException(status_code=401, detail="Invalid or expired session")

        logger.debug(f"Authenticated user: {user.get('email')}")

        # Get investor ID
        investor_resp = dashboard_service.supabase.table('investors').select('id').eq('email', user['email']).execute()
        investor_data = getattr(investor_resp, 'data', [])

        if not investor_data:
            logger.warning(f"Top-up initiate failed: Investor profile not found for email: {user['email']}")
            raise HTTPException(status_code=404, detail="Investor profile not found")

        investor_id = investor_data[0]['id']
        amount = topup_data.amount

        logger.info(f"Initiating top-up for investor {investor_id} with amount {amount}")

        if not amount or amount <= 0:
            logger.warning("Top-up initiate failed: Invalid amount")
            raise HTTPException(status_code=400, detail="Invalid amount - must be greater than 0")

        # Initiate top-up
        service = TopUpService()
        result = service.initiate_topup(investor_id, amount)

        if not result['success']:
            logger.warning(f"Top-up initiate failed: {result['error']}")
            # Return user-friendly message for blocked top-ups
            if "3 days" in result['error'] and "due date" in result['error']:
                raise HTTPException(
                    status_code=403,
                    detail="Top-ups are temporarily disabled. You cannot make top-ups within 3 days of your next due date to ensure fair interest calculation. Please try again after your next payment."
                )
            raise HTTPException(status_code=400, detail=result['error'])

        logger.info(f"Top-up initiated successfully for investor {investor_id}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Unexpected error in top-up initiate: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while processing your top-up request. Please try again or contact support.")

@router.get("/history")
async def get_topup_history(
    authorization: str = Header(None)
) -> Dict[str, Any]:
    """Get top-up history for the authenticated user"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    try:
        # Extract token and validate user
        session_token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        # Get investor ID
        investor_resp = dashboard_service.supabase.table('investors').select('id').eq('email', user['email']).execute()
        investor_data = getattr(investor_resp, 'data', [])
        
        if not investor_data:
            raise HTTPException(status_code=404, detail="Investor profile not found")
        
        investor_id = investor_data[0]['id']
        
        # Get top-up history
        service = TopUpService()
        result = service.get_topup_history(investor_id)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['error'])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching top-up history: {str(e)}")

@router.post("/callback")
async def paystack_callback(request: Request) -> Dict[str, Any]:
    """Handle Paystack payment callback"""
    try:
        data = await request.json()
        reference = data.get('reference')
        status = data.get('status')  # 'success' or 'failed'
        if not reference or not status:
            raise HTTPException(status_code=400, detail="Invalid callback data")

        service = TopUpService()
        result = service.process_paystack_callback(reference, status)
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['error'])

        return {"status": "ok"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing callback: {str(e)}")
