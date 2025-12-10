"""
API routes for withdrawal operations.
"""

from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from pydantic import BaseModel, validator
from ..services.transaction_service import TransactionService
from ..services.portfolio_service import PortfolioService
from ..services.interest_calculation_service import InterestCalculationService
from ..services.dashboard import DashboardService
from passlib.context import CryptContext
import re

router = APIRouter(prefix="/withdrawal", tags=["Withdrawal"])

# Use a CryptContext so we can verify multiple hash schemes (bcrypt, pbkdf2, bcrypt_sha256)
pwd_context = CryptContext(schemes=["bcrypt", "pbkdf2_sha256", "bcrypt_sha256"], deprecated="auto")

class WithdrawalRequest(BaseModel):
    amount: float
    pin: str
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than zero')
        return v
    
    @validator('pin')
    def validate_pin(cls, v):
        if not v:
            raise ValueError('PIN is required')
        if not re.match(r'^\d{4}$', v):
            raise ValueError('PIN must be a 4-digit number')
        return v

@router.post("/request")
async def request_withdrawal(
    withdrawal_request: WithdrawalRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Process a withdrawal request.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract token from "Bearer <token>" format
    session_token = authorization
    if authorization and authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")
    
    try:
        # Get user from session
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        # Get user's investor data
        investor_response = dashboard_service.supabase.table('investors').select('*').eq('email', user['email']).execute()
        investor_data = getattr(investor_response, 'data', [])
        
        if not investor_data:
            raise HTTPException(status_code=404, detail="Investor profile not found")
        
        investor = investor_data[0]
        investor_id = investor['id']
        
        # Validate required fields
        required_fields = ['account_number', 'bank_name', 'bank_account_number']
        for field in required_fields:
            if not investor.get(field):
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Get current spending account balance
        interest_service = InterestCalculationService()
        balance_result = interest_service.get_spending_account_balance(investor_id)
        
        if not balance_result['success']:
            raise HTTPException(status_code=500, detail=balance_result['error'])
        
        spending_balance = balance_result['balance']
        withdrawal_amount = withdrawal_request.amount
        
        # Check if withdrawal amount is higher than spending account balance
        if withdrawal_amount > spending_balance:
            raise HTTPException(status_code=400, detail="Withdrawal amount cannot be higher than spending account balance")
        
        # Verify PIN
        pin_hash = investor.get('pin_hash')
        if not pin_hash:
            raise HTTPException(status_code=400, detail="PIN not set for this account")
        
        # Verify PIN using a CryptContext that supports the common hashing schemes
        try:
            # pwd_context.verify will return True/False for recognized hash formats
            verified = pwd_context.verify(withdrawal_request.pin, pin_hash)
        except Exception:
            # If the stored value isn't a recognized hash (legacy plaintext), allow comparison
            if pin_hash == withdrawal_request.pin:
                verified = True
            else:
                # Unknown/invalid hash format and plaintext mismatch: treat as invalid PIN
                raise HTTPException(status_code=400, detail="Invalid PIN")

        if not verified:
            raise HTTPException(status_code=400, detail="Invalid PIN")
        
        # Process withdrawal from spending account
        withdrawal_result = interest_service.process_user_withdrawal(investor_id, withdrawal_amount)
        
        if not withdrawal_result['success']:
            raise HTTPException(status_code=500, detail=withdrawal_result['error'])
        
        # Record withdrawal request for admin approval (do not process immediately)
        transaction_service = TransactionService()
        withdrawal_data = {
            'investor_id': investor_id,
            'amount': withdrawal_amount,
            'account_number': investor['account_number']
        }

        result = transaction_service.record_withdrawal_request(withdrawal_data)

        if not result['success']:
            raise HTTPException(status_code=500, detail=result['error'])

        # REFACTOR: We no longer restore the spending account balance.
        # The deduction happens immediately upon request and is final unless rejected by admin.
        # If rejected, the admin will handle the refund manually or we can add a refund feature later.
        
        # interest_service = InterestCalculationService()
        # restore_result = interest_service.update_spending_account(investor_id, withdrawal_amount)

        # if not restore_result['success']:
        #     # Log error but don't fail the request
        #     print(f"Warning: Failed to restore spending account balance: {restore_result['error']}")

        return {
            'success': True,
            'message': 'Withdrawal request submitted for admin approval. You will be notified once it is processed.',
            'transaction_id': result['data']['transaction_id'] if result['data'] else None,
            'amount': withdrawal_amount,
            'status': 'pending_admin_approval',
            'estimated_processing_time': '1-2 business days'
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing withdrawal request: {str(e)}")

@router.get("/status/{transaction_id}")
async def get_withdrawal_status(
    transaction_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Get the status of a withdrawal request.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract token from "Bearer <token>" format
    session_token = authorization
    if authorization and authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")
    
    try:
        # Get user from session
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        # Get transaction details
        transaction_response = dashboard_service.supabase.table('transactions').select('*').eq('transaction_id', transaction_id).execute()
        transactions = getattr(transaction_response, 'data', [])
        
        if not transactions:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        transaction = transactions[0]
        
        # Verify this transaction belongs to the user
        investor_response = dashboard_service.supabase.table('investors').select('id').eq('email', user['email']).execute()
        investor_data = getattr(investor_response, 'data', [])
        
        if not investor_data:
            raise HTTPException(status_code=404, detail="Investor profile not found")
        
        investor_id = investor_data[0]['id']
        
        if transaction['investor_id'] != investor_id:
            raise HTTPException(status_code=403, detail="Access denied to this transaction")
        
        return {
            'success': True,
            'transaction_id': transaction_id,
            'status': transaction['withdraw_status'],
            'amount': float(transaction['amount']),
            'created_at': transaction['created_at'],
            'updated_at': transaction['updated_at']
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving withdrawal status: {str(e)}")
