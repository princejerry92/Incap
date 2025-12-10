"""
API routes for investor operations.

This file defines FastAPI endpoints for investors, e.g. /api/v1/investors/create.
It imports and uses the business logic from services/investors.py.
"""

from fastapi import APIRouter, Request, HTTPException

# Import the service class that handles validation and DB logic
from ..services.investors import InvestorService

# Register the router for investor endpoints
router = APIRouter(prefix="/investors", tags=["Investors"])


@router.post('/create')
async def create_investor(request: Request):
    """
    Create a new investor record in the database.
    Accepts JSON payload from frontend, validates and inserts using InvestorService.
    Returns only safe fields (never returns pin_hash).
    """
    payload = await request.json()
    try:
        svc = InvestorService()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Service init error: {e}")

    # Ignore any accountNumber coming from the frontend to ensure server-side generated
    if 'accountNumber' in payload:
        del payload['accountNumber']

    res = svc.create_investor(payload)
    if not res.get('success'):
        raise HTTPException(status_code=400, detail=res.get('error'))

    record = res.get('data') or {}
    # Remove sensitive fields before returning to frontend
    record.pop('pin_hash', None)

    # Return only fields safe for frontend; ensure account_number is included
    return {
        'id': record.get('id'),
        'account_number': record.get('account_number'),
        'email': record.get('email'),
        'first_name': record.get('first_name'),
        'surname': record.get('surname'),
        'initial_investment': record.get('initial_investment'),
        'portfolio_type': record.get('portfolio_type'),
        'status': record.get('status')
    }
