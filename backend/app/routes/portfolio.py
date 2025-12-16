"""
API routes for portfolio operations.
"""

from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from ..services.portfolio_service import PortfolioService

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


@router.get("/available-investments")
async def get_available_investments(
    authorization: Optional[str] = Header(None),
    portfolio_type: Optional[str] = None
):
    """
    Get available investment options for a portfolio type.
    If no portfolio_type is provided, it will be determined from the user's profile.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract token from "Bearer <token>" format
    session_token = authorization
    if authorization and authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")
    
    try:
        # If portfolio_type not provided, get it from user profile
        if not portfolio_type:
            from ..services.dashboard import DashboardService
            dashboard_service = DashboardService()
            user = dashboard_service.get_user_by_session(session_token)
            
            if not user:
                raise HTTPException(status_code=401, detail="Invalid or expired session")
            
            # Get user's investor data to determine portfolio type
            investor_response = dashboard_service.supabase.table('investors').select('portfolio_type').eq('email', user['email']).execute()
            investor_data = getattr(investor_response, 'data', [])
            
            if not investor_data:
                raise HTTPException(status_code=404, detail="Investor profile not found")
            
            portfolio_type = investor_data[0].get('portfolio_type')
        
        service = PortfolioService()
        available_investments = service.get_available_investments(portfolio_type or "")
        
        return {
            'success': True,
            'portfolio_type': portfolio_type,
            'available_investments': available_investments
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching available investments: {str(e)}")


@router.get("/investment-requirements")
async def get_investment_requirements(
    authorization: Optional[str] = Header(None),
    portfolio_type: Optional[str] = None,
    investment_type: Optional[str] = None
):
    """
    Get requirements for a specific investment type.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    if not investment_type:
        raise HTTPException(status_code=400, detail="Investment type is required")
    
    # Extract token from "Bearer <token>" format
    session_token = authorization
    if authorization and authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")
    
    try:
        # If portfolio_type not provided, get it from user profile
        if not portfolio_type:
            from ..services.dashboard import DashboardService
            dashboard_service = DashboardService()
            user = dashboard_service.get_user_by_session(session_token)
            
            if not user:
                raise HTTPException(status_code=401, detail="Invalid or expired session")
            
            # Get user's investor data to determine portfolio type
            investor_response = dashboard_service.supabase.table('investors').select('portfolio_type').eq('email', user['email']).execute()
            investor_data = getattr(investor_response, 'data', [])
            
            if not investor_data:
                raise HTTPException(status_code=404, detail="Investor profile not found")
            
            portfolio_type = investor_data[0].get('portfolio_type')
        
        service = PortfolioService()
        requirements = service.get_investment_requirements(portfolio_type or "", investment_type or "")
        
        if not requirements:
            raise HTTPException(status_code=400, detail=f"Investment type '{investment_type}' is not available for portfolio '{portfolio_type}'")
        
        return {
            'success': True,
            'portfolio_type': portfolio_type,
            'investment_type': investment_type,
            'requirements': requirements
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching investment requirements: {str(e)}")


@router.post("/validate-investment")
async def validate_investment(
    investment_data: dict,
    authorization: Optional[str] = Header(None)
):
    """
    Validate if an investment meets the minimum requirements.
    Expected data: { portfolio_type, investment_type, initial_balance }
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract token from "Bearer <token>" format
    session_token = authorization
    if authorization and authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")
    
    try:
        # Get required data
        portfolio_type = investment_data.get('portfolio_type')
        investment_type = investment_data.get('investment_type')
        initial_balance = investment_data.get('initial_balance')
        
        if not all([portfolio_type, investment_type, initial_balance]):
            raise HTTPException(status_code=400, detail="Missing required fields: portfolio_type, investment_type, initial_balance")
        
        # If portfolio_type not provided in data, get it from user profile
        if not portfolio_type:
            from ..services.dashboard import DashboardService
            dashboard_service = DashboardService()
            user = dashboard_service.get_user_by_session(session_token)
            
            if not user:
                raise HTTPException(status_code=401, detail="Invalid or expired session")
            
            # Get user's investor data to determine portfolio type
            investor_response = dashboard_service.supabase.table('investors').select('portfolio_type').eq('email', user['email']).execute()
            investor_data = getattr(investor_response, 'data', [])
            
            if not investor_data:
                raise HTTPException(status_code=404, detail="Investor profile not found")
            
            portfolio_type = investor_data[0].get('portfolio_type')
        
        service = PortfolioService()
        validation_result = service.validate_investment(
            portfolio_type or "", 
            investment_type or "", 
            float(initial_balance or 0)
        )
        
        return {
            'success': True,
            'validation': validation_result
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating investment: {str(e)}")


@router.get("/portfolio-data")
async def get_portfolio_data(
    authorization: Optional[str] = Header(None)
):
    """
    Get complete portfolio data for authenticated user.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract token from "Bearer <token>" format
    session_token = authorization
    if authorization and authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")
    
    try:
        # Get user from session
        from ..services.dashboard import DashboardService
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        # Get user's investor ID
        investor_response = dashboard_service.supabase.table('investors').select('id').eq('email', user['email']).execute()
        investor_data = getattr(investor_response, 'data', [])
        
        if not investor_data:
            raise HTTPException(status_code=404, detail="Investor profile not found")
        
        investor_id = investor_data[0]['id']
        
        # Get portfolio data
        service = PortfolioService()
        portfolio_data = service.get_portfolio_data(investor_id)
        
        if not portfolio_data['success']:
            raise HTTPException(status_code=500, detail=portfolio_data['error'])
        
        return {
            'success': True,
            'data': portfolio_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching portfolio data: {str(e)}")


@router.post("/update-investment-type")
async def update_investment_type(
    investment_data: dict,
    authorization: Optional[str] = Header(None)
):
    """
    Update the investment type for the authenticated user.
    Expected data: { investment_type }
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract token from "Bearer <token>" format
    session_token = authorization
    if authorization and authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")
    
    try:
        investment_type = investment_data.get('investment_type')
        
        if not investment_type:
            raise HTTPException(status_code=400, detail="Investment type is required")
        
        # Get user from session
        from ..services.dashboard import DashboardService
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        # Get user's investor ID
        investor_response = dashboard_service.supabase.table('investors').select('id').eq('email', user['email']).execute()
        investor_data = getattr(investor_response, 'data', [])
        
        if not investor_data:
            raise HTTPException(status_code=404, detail="Investor profile not found")
        
        investor_id = investor_data[0]['id']
        
        # Update investment type and initialize due dates
        from ..services.investors import InvestorService
        investor_service = InvestorService()
        update_result = investor_service.update_investment_type(investor_id, investment_type)

        if not update_result['success']:
            raise HTTPException(status_code=400, detail=update_result['error'])

        return update_result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating investment type: {str(e)}")


@router.get("/due-dates-data")
async def get_due_dates_data(
    authorization: Optional[str] = Header(None)
):
    """
    Get due dates data for the authenticated user.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract token from "Bearer <token>" format
    session_token = authorization
    if authorization and authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")
    
    try:
        # Get user from session
        from ..services.dashboard import DashboardService
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        # Get user's investor ID
        # Use ilike for case-insensitive email matching
        investor_response = dashboard_service.supabase.table('investors').select('id').ilike('email', user['email']).execute()
        investor_data = getattr(investor_response, 'data', [])
        
        if not investor_data:
            print(f"DEBUG: No investor found for email {user['email']}")
            raise HTTPException(status_code=404, detail="Investor profile not found")
        
        investor_id = investor_data[0]['id']
        print(f"DEBUG: Found investor_id {investor_id} for email {user['email']}")
        
        # Get portfolio data which includes due dates information
        service = PortfolioService()
        portfolio_data = service.get_portfolio_data(investor_id)
        
        if not portfolio_data['success']:
            raise HTTPException(status_code=500, detail=portfolio_data['error'])
        
        # Extract due dates specific data
        # portfolio_data is already the data dictionary from the service
        data = portfolio_data
        
        return {
            'success': True,
            'amount_due': data.get('amount_due', 0),
            'initial_investment': data.get('initial_investment', 0),
            'portfolio_type': data.get('portfolio_type'),
            'investment_type': data.get('investment_type'),
            'available_investments': data.get('available_investments', []),
            'last_due_date': data.get('last_due_date'),
            'next_due_date': data.get('next_due_date'),
            'investment_start_date': data.get('investment_start_date'),
            'investment_expiry_date': data.get('investment_expiry_date'),
            'current_week': data.get('current_week')
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching due dates data: {str(e)}")


@router.get("/amount-due")
async def get_amount_due(
    authorization: Optional[str] = Header(None)
):
    """
    Get amount due for the authenticated user.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract token from "Bearer <token>" format
    session_token = authorization
    if authorization and authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")
    
    try:
        # Get user from session
        from ..services.dashboard import DashboardService
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        # Get user's investor ID
        investor_response = dashboard_service.supabase.table('investors').select('id, portfolio_type, investment_type, initial_investment, created_at').eq('email', user['email']).execute()
        investor_data = getattr(investor_response, 'data', [])
        
        if not investor_data:
            raise HTTPException(status_code=404, detail="Investor profile not found")
        
        investor = investor_data[0]
        investor_id = investor['id']
        portfolio_type = investor.get('portfolio_type')
        investment_type = investor.get('investment_type')
        initial_investment = float(investor.get('initial_investment', 0))
        
        # Calculate weeks elapsed since investment start
        created_at = investor.get('created_at')
        weeks_elapsed = 0
        if created_at:
            from datetime import datetime
            if isinstance(created_at, str):
                start_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            else:
                start_date = created_at
            
            weeks_elapsed = (datetime.now(start_date.tzinfo) - start_date).days // 7
        
        # Calculate amount due
        service = PortfolioService()
        amount_due = service.calculate_amount_due(
            portfolio_type or "", 
            investment_type or "", 
            initial_investment, 
            weeks_elapsed
        ) or 0
        
        return {
            'success': True,
            'amount_due': amount_due,
            'weeks_elapsed': weeks_elapsed
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating amount due: {str(e)}")


@router.get("/weekly-interest")
async def get_weekly_interest(
    authorization: Optional[str] = Header(None)
):
    """
    Get weekly interest for the authenticated user.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract token from "Bearer <token>" format
    session_token = authorization
    if authorization and authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")
    
    try:
        # Get user from session
        from ..services.dashboard import DashboardService
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        # Get user's investor data
        investor_response = dashboard_service.supabase.table('investors').select('portfolio_type, investment_type, initial_investment').eq('email', user['email']).execute()
        investor_data = getattr(investor_response, 'data', [])
        
        if not investor_data:
            raise HTTPException(status_code=404, detail="Investor profile not found")
        
        investor = investor_data[0]
        portfolio_type = investor.get('portfolio_type')
        investment_type = investor.get('investment_type')
        initial_investment = float(investor.get('initial_investment', 0))
        
        # Calculate weekly interest
        service = PortfolioService()
        weekly_interest = service.calculate_weekly_interest(
            portfolio_type or "", 
            investment_type or "", 
            initial_investment
        ) or 0
        
        return {
            'success': True,
            'weekly_interest': weekly_interest
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating weekly interest: {str(e)}")


@router.get("/expiry-date")
async def get_investment_expiry_date(
    authorization: Optional[str] = Header(None)
):
    """
    Get investment expiry date for the authenticated user.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract token from "Bearer <token>" format
    session_token = authorization
    if authorization and authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")
    
    try:
        # Get user from session
        from ..services.dashboard import DashboardService
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        # Get user's investor data
        investor_response = dashboard_service.supabase.table('investors').select('portfolio_type, investment_type, created_at').eq('email', user['email']).execute()
        investor_data = getattr(investor_response, 'data', [])
        
        if not investor_data:
            raise HTTPException(status_code=404, detail="Investor profile not found")
        
        investor = investor_data[0]
        portfolio_type = investor.get('portfolio_type')
        investment_type = investor.get('investment_type')
        created_at = investor.get('created_at')
        
        # Get start date
        from datetime import datetime
        start_date = None
        if created_at:
            if isinstance(created_at, str):
                start_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            else:
                start_date = created_at
        
        # Calculate expiry date
        service = PortfolioService()
        expiry_date = service.get_investment_expiry_date(
            portfolio_type or "", 
            investment_type or "", 
            start_date
        )
        
        if not expiry_date:
            raise HTTPException(status_code=400, detail="Could not calculate expiry date")
        
        return {
            'success': True,
            'expiry_date': expiry_date.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating expiry date: {str(e)}")


@router.get("/weeks-remaining")
async def get_weeks_remaining(
    authorization: Optional[str] = Header(None)
):
    """
    Get weeks remaining for the authenticated user's investment.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract token from "Bearer <token>" format
    session_token = authorization
    if authorization and authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")
    
    try:
        # Get user from session
        from ..services.dashboard import DashboardService
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        # Get user's investor data
        investor_response = dashboard_service.supabase.table('investors').select('portfolio_type, investment_type, created_at').eq('email', user['email']).execute()
        investor_data = getattr(investor_response, 'data', [])
        
        if not investor_data:
            raise HTTPException(status_code=404, detail="Investor profile not found")
        
        investor = investor_data[0]
        portfolio_type = investor.get('portfolio_type')
        investment_type = investor.get('investment_type')
        created_at = investor.get('created_at')
        
        # Get start date
        from datetime import datetime
        start_date = None
        if created_at:
            if isinstance(created_at, str):
                start_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            else:
                start_date = created_at
        
        # Calculate expiry date
        service = PortfolioService()
        expiry_date = service.get_investment_expiry_date(
            portfolio_type or "", 
            investment_type or "", 
            start_date
        )
        
        if not expiry_date:
            raise HTTPException(status_code=400, detail="Could not calculate expiry date")
        
        # Calculate weeks remaining
        weeks_remaining = max(0, (expiry_date - datetime.now(expiry_date.tzinfo)).days // 7)
        
        return {
            'success': True,
            'weeks_remaining': weeks_remaining,
            'expiry_date': expiry_date.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating weeks remaining: {str(e)}")


@router.get("/goals-data")
async def get_goals_data(
    authorization: Optional[str] = Header(None)
):
    """
    Get comprehensive goals data for the authenticated user.
    Includes investment timeline, actual withdrawals, and progress tracking.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    # Extract token from "Bearer <token>" format
    session_token = authorization
    if authorization and authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")

    try:
        # Get user from session
        from ..services.dashboard import DashboardService
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)

        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")

        # Get user's investor ID
        investor_response = dashboard_service.supabase.table('investors').select('id, portfolio_type, investment_type, initial_investment, created_at').eq('email', user['email']).execute()
        investor_data = getattr(investor_response, 'data', [])

        if not investor_data:
            raise HTTPException(status_code=404, detail="Investor profile not found")

        investor = investor_data[0]
        investor_id = investor['id']
        portfolio_type = investor.get('portfolio_type')
        investment_type = investor.get('investment_type')
        initial_investment = float(investor.get('initial_investment', 0))
        investment_start_date = investor.get('created_at')
        
        # Debug logging
        print(f"DEBUG: investor_id={investor_id}")
        print(f"DEBUG: portfolio_type={portfolio_type}")
        print(f"DEBUG: investment_type={investment_type}")
        print(f"DEBUG: initial_investment={initial_investment}")
        print(f"DEBUG: investment_start_date={investment_start_date}")

        # Get investment rules
        from ..services.portfolio_service import PortfolioService
        portfolio_service = PortfolioService()
        requirements = portfolio_service.get_investment_requirements(portfolio_type, investment_type)
        
        # Debug logging
        print(f"DEBUG: requirements={requirements}")

        if not requirements:
            raise HTTPException(status_code=400, detail=f"Invalid investment type {investment_type} for portfolio {portfolio_type}")

        weekly_rate = requirements["weekly_interest_rate"] / 100
        weekly_interest = initial_investment * weekly_rate
        duration_weeks = requirements["expiry_weeks"]
        
        # Debug logging
        print(f"DEBUG: weekly_rate={weekly_rate}")
        print(f"DEBUG: weekly_interest={weekly_interest}")
        print(f"DEBUG: duration_weeks={duration_weeks}")

        # Get all transactions for this investor
        transaction_response = dashboard_service.supabase.table('transactions').select('*').eq('investor_id', investor_id).execute()
        transactions = getattr(transaction_response, 'data', [])
        
        # Debug logging
        print(f"DEBUG: transactions count={len(transactions) if transactions else 0}")

        # Filter withdrawal transactions
        withdrawals = []
        for transaction in transactions:
            if (transaction.get('transaction_type') == 'withdrawal' and
                transaction.get('withdraw_status') == 'sent'):
                withdrawals.append({
                    'id': transaction.get('id'),
                    'amount': float(transaction.get('amount', 0)),
                    'date': transaction.get('created_at'),
                    'transaction_id': transaction.get('transaction_id')
                })

        # Calculate timeline data
        from datetime import datetime, timedelta
        import math

        # Parse investment start date
        if isinstance(investment_start_date, str):
            start_date = datetime.fromisoformat(investment_start_date.replace('Z', '+00:00'))
        else:
            start_date = investment_start_date or datetime.now()

        # Calculate weeks elapsed
        now = datetime.now(start_date.tzinfo)
        weeks_elapsed = max(0, (now - start_date).days // 7)
        weeks_remaining = max(0, duration_weeks - weeks_elapsed)
        
        # Debug logging
        print(f"DEBUG: start_date={start_date}")
        print(f"DEBUG: now={now}")
        print(f"DEBUG: weeks_elapsed={weeks_elapsed}")
        print(f"DEBUG: weeks_remaining={weeks_remaining}")
        print(f"DEBUG: duration_weeks={duration_weeks}")

        # Generate timeline data
        timeline = []
        cumulative_interest = 0
        cumulative_withdrawals = sum(w['amount'] for w in withdrawals)

        for week in range(0, duration_weeks + 1):
            week_date = start_date + timedelta(weeks=week)
            is_completed = week <= weeks_elapsed
            is_current = week == weeks_elapsed
            is_future = week > weeks_elapsed

            # Add weekly interest
            if week > 0:  # No interest on week 0
                cumulative_interest += weekly_interest

            # Check if there were withdrawals this week
            week_withdrawals = []
            for withdrawal in withdrawals:
                withdrawal_date = withdrawal['date']
                if isinstance(withdrawal_date, str):
                    withdrawal_date = datetime.fromisoformat(withdrawal_date.replace('Z', '+00:00'))

                withdrawal_week = (withdrawal_date - start_date).days // 7
                if withdrawal_week == week:
                    week_withdrawals.append(withdrawal)

            # Calculate if renewable (when interest >= initial investment)
            is_renewable = cumulative_interest >= initial_investment
            is_final_week = week == duration_weeks

            timeline.append({
                'week': week,
                'date': week_date.isoformat(),
                'is_completed': is_completed,
                'is_current': is_current,
                'is_future': is_future,
                'interest_earned': weekly_interest if week > 0 else 0,
                'cumulative_interest': cumulative_interest,
                'withdrawals': week_withdrawals,
                'is_renewable': is_renewable,
                'is_final_week': is_final_week
            })

        # Calculate remaining balance
        remaining_balance = initial_investment + cumulative_interest - cumulative_withdrawals

        return {
            'success': True,
            'data': {
                'investment': {
                    'id': investor_id,
                    'portfolio_type': portfolio_type,
                    'investment_type': investment_type,
                    'initial_investment': initial_investment,
                    'start_date': start_date.isoformat(),
                    'weekly_interest_rate': requirements["weekly_interest_rate"],
                    'weekly_interest_amount': weekly_interest,
                    'duration_weeks': duration_weeks
                },
                'progress': {
                    'weeks_elapsed': weeks_elapsed,
                    'total_weeks': duration_weeks,
                    'completion_percentage': min(100, round((weeks_elapsed / duration_weeks) * 100)) if duration_weeks > 0 else 0,
                    'cumulative_interest': cumulative_interest,
                    'cumulative_withdrawals': cumulative_withdrawals,
                    'remaining_balance': remaining_balance,
                    'is_renewable': cumulative_interest >= initial_investment
                },
                'withdrawals': withdrawals,
                'timeline': timeline
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching goals data: {str(e)}")


@router.get("/analytics-data")
async def get_analytics_data(
    authorization: Optional[str] = Header(None)
):
    """
    Get comprehensive analytics data for investment charts and visualizations.
    Returns formatted data for D3.js charts including interest trends, withdrawals, and portfolio metrics.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    # Extract token from "Bearer <token>" format
    session_token = authorization
    if authorization and authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")

    try:
        # Get user from session
        from ..services.dashboard import DashboardService
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)

        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")

        # Get user's investor ID
        investor_response = dashboard_service.supabase.table('investors').select('id, portfolio_type, investment_type, initial_investment, created_at').eq('email', user['email']).execute()
        investor_data = getattr(investor_response, 'data', [])

        if not investor_data:
            return {
                'success': True,
                'data': {
                    'interest_trend': [],
                    'withdrawals': [],
                    'portfolio_metrics': {
                        'total_interest': 0,
                        'total_withdrawals': 0,
                        'current_balance': 0,
                        'weeks_remaining': 0,
                        'performance_percentage': 0
                    },
                    'summary_stats': {
                        'total_earned': 0,
                        'total_withdrawn': 0,
                        'average_weekly_interest': 0,
                        'largest_withdrawal': 0,
                        'withdrawal_count': 0
                    }
                }
            }

        investor = investor_data[0]
        investor_id = investor['id']
        portfolio_type = investor.get('portfolio_type')
        investment_type = investor.get('investment_type')
        initial_investment = float(investor.get('initial_investment', 0))
        investment_start_date = investor.get('created_at')

        # Get investment rules
        from ..services.portfolio_service import PortfolioService
        portfolio_service = PortfolioService()
        requirements = portfolio_service.get_investment_requirements(portfolio_type, investment_type)

        # Handle case where user hasn't selected an investment type yet
        if not requirements:
            if not investment_type or investment_type == 'None' or investment_type == 'Not Selected':
                # Return empty analytics data for users who haven't selected an investment type
                return {
                    'success': True,
                    'data': {
                        'interest_trend': [],
                        'withdrawals': [],
                        'weekly_withdrawals': {},
                        'portfolio_metrics': {
                            'total_interest': 0,
                            'total_withdrawals': 0,
                            'current_balance': initial_investment,
                            'weeks_remaining': 0,
                            'performance_percentage': 0,
                            'initial_investment': initial_investment,
                            'weekly_interest_rate': 0,
                            'portfolio_type': portfolio_type,
                            'investment_type': investment_type
                        },
                        'summary_stats': {
                            'total_earned': 0,
                            'total_withdrawn': 0,
                            'average_weekly_interest': 0,
                            'largest_withdrawal': 0,
                            'withdrawal_count': 0,
                            'weeks_elapsed': 0,
                            'total_weeks': 0
                        }
                    }
                }
            else:
                raise HTTPException(status_code=400, detail=f"Invalid investment type {investment_type} for portfolio {portfolio_type}")

        weekly_rate = requirements["weekly_interest_rate"] / 100
        weekly_interest = initial_investment * weekly_rate
        duration_weeks = requirements["expiry_weeks"]

        # Get all transactions for this investor
        transaction_response = dashboard_service.supabase.table('transactions').select('*').eq('investor_id', investor_id).execute()
        transactions = getattr(transaction_response, 'data', [])

        # Get spending account balance
        from ..services.interest_calculation_service import InterestCalculationService
        interest_service = InterestCalculationService()
        spending_balance_result = interest_service.get_spending_account_balance(investor_id)

        # Parse investment start date
        from datetime import datetime, timedelta
        if isinstance(investment_start_date, str):
            start_date = datetime.fromisoformat(investment_start_date.replace('Z', '+00:00'))
        else:
            start_date = investment_start_date or datetime.now()

        # Calculate weeks elapsed
        now = datetime.now(start_date.tzinfo)
        weeks_elapsed = max(0, (now - start_date).days // 7)
        weeks_remaining = max(0, duration_weeks - weeks_elapsed)

        # Generate interest trend data
        interest_trend = []
        cumulative_interest = 0

        for week in range(0, min(weeks_elapsed + 1, duration_weeks + 1)):
            week_date = start_date + timedelta(weeks=week)
            if week > 0:  # No interest on week 0
                cumulative_interest += weekly_interest

            interest_trend.append({
                'week': week,
                'date': week_date.isoformat(),
                'weekly_interest': weekly_interest,
                'cumulative_interest': cumulative_interest,
                'total_balance': initial_investment + cumulative_interest
            })

        # Process withdrawal data
        withdrawals = []
        withdrawal_stats = {
            'total_withdrawn': 0,
            'withdrawal_count': 0,
            'largest_withdrawal': 0,
            'weekly_withdrawals': {}
        }

        for transaction in transactions:
            if (transaction.get('transaction_type') == 'withdrawal' and
                transaction.get('withdraw_status') == 'sent'):
                amount = float(transaction.get('amount', 0))
                withdrawal_date = transaction.get('created_at')

                if isinstance(withdrawal_date, str):
                    withdrawal_date = datetime.fromisoformat(withdrawal_date.replace('Z', '+00:00'))

                withdrawal_week = (withdrawal_date - start_date).days // 7

                withdrawals.append({
                    'id': transaction.get('id'),
                    'amount': amount,
                    'date': withdrawal_date.isoformat(),
                    'week': withdrawal_week,
                    'transaction_id': transaction.get('transaction_id')
                })

                # Update stats
                withdrawal_stats['total_withdrawn'] += amount
                withdrawal_stats['withdrawal_count'] += 1
                withdrawal_stats['largest_withdrawal'] = max(withdrawal_stats['largest_withdrawal'], amount)

                # Group by week for chart
                week_key = str(withdrawal_week)
                if week_key not in withdrawal_stats['weekly_withdrawals']:
                    withdrawal_stats['weekly_withdrawals'][week_key] = 0
                withdrawal_stats['weekly_withdrawals'][week_key] += amount

        # Calculate portfolio metrics
        current_balance = initial_investment + cumulative_interest - withdrawal_stats['total_withdrawn']
        performance_percentage = min(100, round((weeks_elapsed / duration_weeks) * 100)) if duration_weeks > 0 else 0

        # Calculate summary statistics
        average_weekly_interest = weekly_interest if weeks_elapsed > 0 else 0

        return {
            'success': True,
            'data': {
                'interest_trend': interest_trend,
                'withdrawals': withdrawals,
                'weekly_withdrawals': withdrawal_stats['weekly_withdrawals'],
                'portfolio_metrics': {
                    'total_interest': cumulative_interest,
                    'total_withdrawals': withdrawal_stats['total_withdrawn'],
                    'current_balance': current_balance,
                    'weeks_remaining': weeks_remaining,
                    'performance_percentage': performance_percentage,
                    'initial_investment': initial_investment,
                    'weekly_interest_rate': requirements["weekly_interest_rate"],
                    'portfolio_type': portfolio_type,
                    'investment_type': investment_type
                },
                'summary_stats': {
                    'total_earned': cumulative_interest,
                    'total_withdrawn': withdrawal_stats['total_withdrawn'],
                    'average_weekly_interest': average_weekly_interest,
                    'largest_withdrawal': withdrawal_stats['largest_withdrawal'],
                    'withdrawal_count': withdrawal_stats['withdrawal_count'],
                    'weeks_elapsed': weeks_elapsed,
                    'total_weeks': duration_weeks
                }
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching analytics data: {str(e)}")
