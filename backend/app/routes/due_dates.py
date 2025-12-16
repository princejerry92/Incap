"""
API routes for due dates functionality
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import logging
from ..services.dashboard import DashboardService
from ..services.interest_calculation_service import InterestCalculationService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/due-dates", tags=["due_dates"])

@router.get("/investor/{investor_id}")
async def get_investor_due_dates(investor_id: str, authorization: str = Header(None)) -> Dict[str, Any]:
    """Get due date information for an investor"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header required")
        
        # Extract token from "Bearer <token>" format
        session_token = authorization
        if authorization and authorization.startswith("Bearer "):
            session_token = authorization.replace("Bearer ", "")
        
        # Get user from session
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        # Get due date information from investors table
        investor_result = dashboard_service.supabase.table('investors')\
            .select('last_due_date, next_due_date, investment_start_date, created_at, current_week, investment_expiry_date, portfolio_type, investment_type')\
            .eq('id', investor_id)\
            .execute()

        investor_data = getattr(investor_result, 'data', [])

        # Verify investor exists and has data
        if not (investor_data and len(investor_data) > 0):
            # Fallback: Try to find investor by email (in case user_id was passed)
            # `get_user_by_session` returns a dict, not an object with attributes — use dict access
            if user and user.get('email'):
                investor_result = dashboard_service.supabase.table('investors')\
                    .select('id, last_due_date, next_due_date, investment_start_date, created_at, current_week, investment_expiry_date, portfolio_type, investment_type')\
                    .eq('email', user.get('email'))\
                    .execute()
                investor_data = getattr(investor_result, 'data', [])
                
                if investor_data and len(investor_data) > 0:
                    # Found by email, update investor_id to the correct one
                    investor_id = investor_data[0]['id']
            
            if not (investor_data and len(investor_data) > 0):
                return {
                    "success": False,
                    "error": "Investor not found"
                }

        # Get spending account balance
        interest_service = InterestCalculationService()
        balance_result = interest_service.get_spending_account_balance(investor_id)
        spending_balance = balance_result['balance'] if balance_result['success'] else 0

        # Ensure due dates are up to date using centralized service
        ensure_result = interest_service.ensure_due_dates_up_to_date(investor_id)

        if ensure_result['success']:
            investor = ensure_result['data']
            
            last_due_date = investor.get('last_due_date')
            next_due_date = investor.get('next_due_date')
            investment_start_date = investor.get('investment_start_date') or investor.get('created_at')
            current_week = int(investor.get('current_week', 0))
            investment_expiry_date = investor.get('investment_expiry_date')
            
            return {
                "success": True,
                "data": {
                    "last_due_date": last_due_date,
                    "next_due_date": next_due_date,
                    "investment_start_date": investment_start_date,
                    "current_week": current_week,
                    "investment_expiry_date": investment_expiry_date,
                    "amount_due": spending_balance,
                    "upcoming_payments": []
                }
            }
        else:
            # Fallback if investor not found or error
            return {
                "success": False,
                "error": ensure_result.get('error', 'Failed to retrieve due dates')
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching due dates: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching due dates: {str(e)}")

@router.get("/investor/{investor_id}/schedule")
async def get_investment_schedule(investor_id: str, authorization: str = Header(None)) -> Dict[str, Any]:
    """Get the complete investment payment schedule"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header required")
        
        # Extract token from "Bearer <token>" format
        session_token = authorization
        if authorization and authorization.startswith("Bearer "):
            session_token = authorization.replace("Bearer ", "")
        
        # Get user from session
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        # Get investor details
        investor_result = dashboard_service.supabase.table('investors')\
            .select('initial_investment, portfolio_type, investment_type, created_at')\
            .eq('id', investor_id)\
            .execute()
        
        # Handle response properly
        investor_data = getattr(investor_result, 'data', [])
        investor_error = getattr(investor_result, 'error', None)
        
        if not (investor_data and len(investor_data) > 0):
            raise HTTPException(status_code=404, detail="Investor not found")
        
        investor = investor_data[0]
        initial_investment = float(investor.get('initial_investment', 0))
        portfolio_type = investor.get('portfolio_type')
        investment_type = investor.get('investment_type')
        created_at = investor.get('created_at')
        
        # Get investment requirements to calculate weekly interest
        from ..services.portfolio_service import PortfolioService
        portfolio_service = PortfolioService()
        requirements = portfolio_service.get_investment_requirements(portfolio_type, investment_type)
        
        if not requirements:
            raise HTTPException(status_code=400, detail="Invalid investment type or portfolio")
        
        weekly_rate = requirements["weekly_interest_rate"] / 100
        weekly_interest = initial_investment * weekly_rate
        
        # Calculate investment duration
        investment_duration_weeks = requirements.get("duration_weeks", 12)  # Default to 12 weeks
        
        # Parse created_at date
        if isinstance(created_at, str):
            start_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        else:
            start_date = created_at
        
        # Generate payment schedule
        upcoming_payments = []
        for week in range(1, investment_duration_weeks + 1):
            payment_date = start_date + timedelta(weeks=week)
            upcoming_payments.append({
                "date": payment_date.date().isoformat(),
                "amount": weekly_interest,
                "week": week
            })
        
        return {
            "success": True,
            "data": {
                "initial_investment": initial_investment,
                "weekly_interest": weekly_interest,
                "investment_duration_weeks": investment_duration_weeks,
                "upcoming_payments": upcoming_payments
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating investment schedule: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating investment schedule: {str(e)}")
