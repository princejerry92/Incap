"""
Dashboard service for retrieving user dashboard data.
Handles fetching user info, investment balance, and related data.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from ..core.config import settings
from .transaction_service import TransactionService
from .interest_calculation_service import InterestCalculationService
import logging

logger = logging.getLogger(__name__)

try:
    from supabase import create_client
except Exception:
    create_client = None


class DashboardService:
    """Service for retrieving dashboard data for authenticated users."""

    def __init__(self):
        if create_client is None:
            raise RuntimeError("supabase package not installed")

        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise RuntimeError("Supabase config missing in settings")

        self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    def get_user_by_session(self, session_token: str) -> Optional[Dict[str, Any]]:
        """Get user data from session token."""
        try:
            # Get session
            session_response = self.supabase.table('sessions').select('*').eq('token', session_token).execute()
            session_data = getattr(session_response, 'data', [])

            if not session_data or len(session_data) == 0:
                logger.warning(f"Session token not found: {session_token[:8]}...")
                return None

            session = session_data[0]
            created_at = session.get('created_at')

            # Check if session is expired (6 hours from creation)
            if not self._is_session_valid(created_at):
                # Session expired, delete it
                self.supabase.table('sessions').delete().eq('token', session_token).execute()
                logger.info(f"Session expired and deleted: {session_token[:8]}... (created at: {created_at})")
                return None

            # Get user
            user_response = self.supabase.table('users').select('*').eq('id', session['user_id']).execute()
            user_data = getattr(user_response, 'data', [])

            if user_data and len(user_data) > 0:
                return user_data[0]

            logger.warning(f"User not found for session user_id: {session['user_id']}")
            return None
        except Exception as e:
            logger.error(f"Error getting user by session: {str(e)}")
            return None

    def _is_session_valid(self, created_at) -> bool:
        """Check if session is still valid (within 6 hours)."""
        if not created_at:
            logger.warning("Session created_at is null")
            return False

        try:
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            now = datetime.now(created_at.tzinfo) if hasattr(created_at, 'tzinfo') else datetime.now()
            is_valid = now < created_at + timedelta(hours=6)
            if not is_valid:
                logger.debug(f"Session expired. Created: {created_at}, Now: {now}")
            return is_valid
        except Exception as e:
            logger.error(f"Error checking session validity: {str(e)}")
            return False

    def get_total_amount_due(self, investor_id: str) -> float:
        """Calculate total amount due for a user from transactions table."""
        try:
            if not investor_id:
                return 0.0
            
            # Get all transactions for this investor with amount_due > 0 and withdrawal not requested
            # Exclude end_investment and renew_investment transaction types
            response = self.supabase.table('transactions') \
                .select('amount_due') \
                .eq('investor_id', investor_id) \
                .gt('amount_due', 0) \
                .eq('withdrawal_requested', False) \
                .not_.in_('transaction_type', ['end_investment', 'renew_investment']) \
                .execute()

            transactions_data = getattr(response, 'data', [])

            # Sum all amount_due values
            total_due = sum(float(tx.get('amount_due', 0)) for tx in transactions_data)

            return total_due
        except Exception as e:
            print(f"Error calculating total amount due: {e}")
            return 0.0

    def get_user_investments(self, user_email: str, investments_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get all investments linked to a user using pre-fetched data."""
        try:
            if not investments_data:
                return {
                    'total_balance': 0,
                    'total_due': 0,
                    'spending_balance': 0,
                    'investments': []
                }

            # Calculate totals
            total_balance = 0
            investments = []

            for investor in investments_data:
                initial_investment = float(investor.get('initial_investment', 0))
                total_investment = float(investor.get('total_investment', 0) or initial_investment)  # Use total_investment for display, fallback to initial
                total_balance += total_investment

                investments.append({
                    'investor_id': investor.get('id'),
                    'account_number': investor.get('account_number'),
                    'portfolio_type': investor.get('portfolio_type'),
                    'investment_type': investor.get('investment_type'),
                    'initial_investment': total_investment,  # Show total investment as initial for UI display
                    'current_balance': total_investment,  # Use total investment for current balance
                    'is_primary': False,  # TODO: Determine primary investment logic
                    'created_at': investor.get('created_at'),
                    # Include bank details
                    'bank_name': investor.get('bank_name'),
                    'bank_account_name': investor.get('bank_account_name'),
                    'bank_account_number': investor.get('bank_account_number')
                })

            # Get spending account balance
            spending_balance = 0
            if investments_data:
                investor_id = investments_data[0]['id']
                # Optimization: We could pre-fetch this too, but for now let's keep it as is 
                # or rely on the fact that we might fetch it in the main method if needed.
                # For now, let's keep the call but it's one call per dashboard load, not per investment.
                interest_service = InterestCalculationService()
                balance_result = interest_service.get_spending_account_balance(investor_id)
                if balance_result['success']:
                    spending_balance = balance_result['balance']

            # Get primary investment (first one for now)
            primary = investments[0] if investments else None

            return {
                'total_balance': total_balance,
                'total_due': 0,  # Will be set in main method or calculated here if needed
                'spending_balance': spending_balance,
                'investments': investments,
                'primary_investment': primary
            }
        except Exception as e:
            print(f"Error getting user investments: {e}")
            return {
                'total_balance': 0,
                'total_due': 0,
                'spending_balance': 0,
                'investments': []
            }

    def get_recent_transactions(self, investor_id: str, limit: int = 10) -> list:
        """Get recent transactions for a user."""
        try:
            if not investor_id:
                return []

            # Get transaction history using TransactionService
            transaction_service = TransactionService()
            transactions_result = transaction_service.get_transaction_history(investor_id)
            
            if transactions_result['success']:
                # Return limited number of transactions
                return transactions_result['data'][:limit]
            else:
                return []
        except Exception as e:
            print(f"Error getting recent transactions: {e}")
            return []

    def get_dashboard_data(self, session_token: str) -> Dict[str, Any]:
        """Get complete dashboard data for a user."""
        user = self.get_user_by_session(session_token)

        if not user:
            return {
                'success': False,
                'error': 'Invalid or expired session'
            }
            
        # Pre-fetch investor data ONCE
        investor_data = []
        try:
            investor_response = self.supabase.table('investors').select('*').eq('email', user['email']).execute()
            investor_data = getattr(investor_response, 'data', [])
        except Exception as e:
            print(f"Error fetching investor data: {e}")
            investor_data = []

        investor_id = investor_data[0]['id'] if investor_data else None

        # Check and process due dates if investor exists
        # MOVED TO BACKGROUND SCHEDULER to prevent infinite payment loops on dashboard refresh
        # if investor_id:
        #     try:
        #         from .interest_calculation_service import InterestCalculationService
        #         interest_service = InterestCalculationService()
        #         # Use centralized check
        #         interest_service.process_investor_due_date_check(investor_id)
        #     except Exception as e:
        #         print(f"Error checking due dates: {e}")

        # Background update: populate NULL values for current_week and investment_expiry_date
        # This ensures backward compatibility for existing investors when columns were added
        try:
            self._populate_missing_investor_fields_background()
        except Exception as e:
            print(f"Error in background field population: {e}")

        # Get investment data using pre-fetched investor data
        investment_data = self.get_user_investments(user['email'], investor_data)

        # Get recent transactions
        transactions = self.get_recent_transactions(investor_id) if investor_id else []

        # Get user's investor profile to determine available investments and interest rate
        available_investments = []
        interest_rate = 0
        
        if investor_data:
            try:
                from .portfolio_service import PortfolioService
                portfolio_service = PortfolioService()
                portfolio_type = investor_data[0].get('portfolio_type', '')
                investment_type = investor_data[0].get('investment_type', '')
                available_investments = portfolio_service.get_available_investments(portfolio_type)
                
                # Get interest rate for the current investment
                requirements = portfolio_service.get_investment_requirements(portfolio_type, investment_type)
                if requirements:
                    interest_rate = requirements.get('weekly_interest_rate', 0)
            except Exception as e:
                print(f"Error getting investor profile for available investments: {e}")
                available_investments = []

        # Get analytics summary
        analytics_summary = {}
        if investor_data:
            try:
                from .portfolio_service import PortfolioService
                portfolio_service = PortfolioService()
                investor = investor_data[0]
                portfolio_type = investor.get('portfolio_type')
                investment_type = investor.get('investment_type')
                initial_investment = float(investor.get('initial_investment', 0))
                investment_start_date = investor.get('created_at')

                requirements = portfolio_service.get_investment_requirements(portfolio_type, investment_type)

                if requirements:
                    weekly_rate = requirements["weekly_interest_rate"] / 100
                    weekly_interest = initial_investment * weekly_rate
                    duration_weeks = requirements["expiry_weeks"]

                    # Parse investment start date
                    from datetime import datetime
                    if isinstance(investment_start_date, str):
                        start_date = datetime.fromisoformat(investment_start_date.replace('Z', '+00:00'))
                    else:
                        start_date = investment_start_date or datetime.now()

                    # Calculate weeks elapsed
                    now = datetime.now(start_date.tzinfo)
                    weeks_elapsed = max(0, (now - start_date).days // 7)
                    cumulative_interest = weekly_interest * max(0, weeks_elapsed - 1) if weeks_elapsed > 0 else 0

                    # Get withdrawal stats from ALREADY FETCHED transactions if possible, 
                    # but get_recent_transactions limits to 10. 
                    # So we might need to fetch all transactions for analytics if not passed.
                    # For optimization, let's fetch all transactions once if we haven't already.
                    # But here we need ALL transactions for stats.
                    
                    # Optimization: Fetch all transactions for this investor once for analytics and goals
                    transaction_response = self.supabase.table('transactions').select('*').eq('investor_id', investor_id).execute()
                    all_transactions = getattr(transaction_response, 'data', [])

                    total_withdrawn = 0
                    withdrawal_count = 0
                    largest_withdrawal = 0

                    for transaction in all_transactions:
                        if (transaction.get('transaction_type') == 'withdrawal' and
                            transaction.get('withdraw_status') == 'sent'):
                            amount = float(transaction.get('amount', 0))
                            total_withdrawn += amount
                            withdrawal_count += 1
                            largest_withdrawal = max(largest_withdrawal, amount)

                    analytics_summary = {
                        'total_earned': cumulative_interest,
                        'total_withdrawn': total_withdrawn,
                        'average_weekly_interest': weekly_interest,
                        'largest_withdrawal': largest_withdrawal,
                        'withdrawal_count': withdrawal_count,
                        'weeks_elapsed': weeks_elapsed,
                        'total_weeks': duration_weeks
                    }
            except Exception as e:
                print(f"Error getting analytics summary: {e}")
                analytics_summary = {}
        else:
            all_transactions = [] # Empty if no investor

        # Get goals data for detailed investment progress and timeline
        goals_data = {}
        if investor_data:
            try:
                from .portfolio_service import PortfolioService
                portfolio_service = PortfolioService()
                investor = investor_data[0]
                portfolio_type = investor.get('portfolio_type')
                investment_type = investor.get('investment_type')
                initial_investment = float(investor.get('initial_investment', 0))
                investment_start_date = investor.get('created_at')

                # Get investment rules
                requirements = portfolio_service.get_investment_requirements(portfolio_type, investment_type)
                if requirements:
                    weekly_rate = requirements["weekly_interest_rate"] / 100
                    weekly_interest = initial_investment * weekly_rate
                    duration_weeks = requirements["expiry_weeks"]

                    # Use pre-fetched all_transactions
                    
                    # Filter withdrawal transactions
                    withdrawals = []
                    for transaction in all_transactions:
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

                    goals_data = {
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
            except Exception as e:
                print(f"Error getting goals data for dashboard: {e}")
                goals_data = {}

        # Get member since date from pre-fetched investor data
        investor_created_at = None
        if investor_data:
            investor_created_at = investor_data[0].get('created_at')

        # Get user points data
        user_points = {}
        try:
            from .referral_service import ReferralService
            referral_service = ReferralService()
            points_result = referral_service.get_user_points(user['id'])
            if points_result['success']:
                user_points = points_result
        except Exception as e:
            print(f"Error getting user points for dashboard: {e}")
            user_points = {}

        # Get notifications
        notifications = []
        try:
            if investor_id:
                # Get notifications from the database
                from datetime import datetime, timedelta
                seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
                
                from .notification_persistence_service import NotificationPersistenceService
                notification_service = NotificationPersistenceService()
                notifications_result = notification_service.get_notifications(
                    investor_id=investor_id,
                    limit=20,
                    since=seven_days_ago
                )
                
                if notifications_result['success']:
                    notifications = notifications_result['data']
                else:
                    print(f"Error fetching notifications: {notifications_result.get('error', 'Unknown error')}")
                    notifications = self._get_fallback_notifications(user, investor_id)
            else:
                # Fallback if no investor ID
                notifications = []
        except Exception as e:
            print(f"Error getting notifications: {e}")
            notifications = []

        return {
            'success': True,
            'has_investor_account': bool(investor_data),
            'user': {
                'id': user.get('id'),
                'email': user.get('email'),
                'first_name': user.get('first_name', ''),
                'surname': user.get('surname', ''),
                'full_name': f"{user.get('first_name', '')} {user.get('surname', '')}".strip(),
                'profile_pic': user.get('profile_pic', ''),
                'phone_number': user.get('phone_number', ''),
                'address': user.get('address', ''),
                'created_at': investor_created_at,
                'referral_code': user.get('referral_code')
            },
            'investment': {
                'total_balance': investment_data['total_balance'],
                'total_due': investment_data['spending_balance'],  # Use spending balance instead of amount due
                'spending_balance': investment_data['spending_balance'],
                'primary_account': investment_data.get('primary_investment', {}).get('account_number', '****'),
                'portfolio_type': investment_data.get('primary_investment', {}).get('portfolio_type', 'N/A'),
                'investment_type': investment_data.get('primary_investment', {}).get('investment_type', 'N/A'),
                'available_investments': available_investments,
                'interest_rate': interest_rate
            },
            'investments': investment_data['investments'],
            'transactions': transactions,
            'goals': goals_data,
            'analytics': analytics_summary,
            'notifications': notifications,
            'points': user_points,
            'summary': {
                'total_investments': len(investment_data['investments']),
                'active_portfolios': len([inv for inv in investment_data['investments']]),
                'last_login': user.get('last_login')
            }
        }

    def _get_fallback_notifications(self, user, investor_id):
        """Fallback method to generate notifications for backward compatibility."""
        try:
            from .notification_service import NotificationService
            from datetime import datetime, timedelta

            # Check for recent top-ups in the last 7 days that might need notifications
            seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
            recent_topups = self.supabase.table('topups').select('*').eq('investor_id', investor_id).gte('created_at', seven_days_ago).eq('paystack_status', 'success').execute()
            recent_topup_data = getattr(recent_topups, 'data', [])

            # Generate notifications for recent top-ups if they exist
            notifications = []
            for topup in recent_topup_data:
                # Check if this top-up already has a notification (we'll use a simple check)
                # For now, generate the notification - frontend will handle duplicates
                notification = NotificationService.generate_topup_completed_notification(
                    investor_id=topup['investor_id'],
                    amount=float(topup['amount'])
                )
                notifications.append(notification)

            return notifications
        except Exception as e:
            print(f"Error in fallback notification generation: {e}")
            return []

    def update_user_profile(self, user_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile information."""
        try:
            # Update user data
            response = self.supabase.table('users').update(update_data).eq('id', user_id).execute()
            
            # Get updated user data
            user_response = self.supabase.table('users').select('*').eq('id', user_id).execute()
            user_data = getattr(user_response, 'data', [])
            
            if user_data and len(user_data) > 0:
                user = user_data[0]
                return {
                    'success': True,
                    'message': 'Profile updated successfully',
                    'user': {
                        'id': user.get('id'),
                        'email': user.get('email'),
                        'first_name': user.get('first_name', ''),
                        'surname': user.get('surname', ''),
                        'full_name': f"{user.get('first_name', '')} {user.get('surname', '')}".strip(),
                        'profile_pic': user.get('profile_pic', ''),
                        'phone_number': user.get('phone_number', ''),
                        'address': user.get('address', ''),
                        'last_login': user.get('last_login')
                    }
                }
            else:
                return {
                    'success': False,
                    'error': 'Failed to retrieve updated user data'
                }
        except Exception as e:
            print(f"Error updating user profile: {e}")
            return {
                'success': False,
                'error': f"Error updating profile: {str(e)}"
            }

    def _populate_missing_investor_fields_background(self) -> None:
        """Background service to populate NULL values in current_week and investment_expiry_date columns.
        This ensures backward compatibility when new columns are added after data exists.
        Runs as a background process when dashboard data is loaded.
        """
        try:
            # Check for investors with NULL current_week or investment_expiry_date
            null_fields_response = self.supabase.table('investors')\
                .select('id, portfolio_type, investment_type, investment_start_date, created_at, current_week, investment_expiry_date')\
                .or_('current_week.is.null,investment_expiry_date.is.null')\
                .execute()

            null_fields_data = getattr(null_fields_response, 'data', [])

            if not null_fields_data:
                # No investors with NULL fields found
                return

            # Process each investor with missing data
            processed_count = 0
            for investor in null_fields_data:
                investor_id = investor['id']
                portfolio_type = investor.get('portfolio_type')
                investment_type = investor.get('investment_type')
                investment_start_date = investor.get('investment_start_date') or investor.get('created_at')

                # Skip if no investment type (can't calculate expiry without rules)
                if not investment_type:
                    continue

                try:
                    # Use InterestCalculationService to calculate missing fields
                    interest_service = InterestCalculationService()

                    # Get portfolio requirements to calculate expiry date
                    from .portfolio_service import PortfolioService
                    portfolio_service = PortfolioService()
                    requirements = portfolio_service.get_investment_requirements(portfolio_type, investment_type)

                    if requirements and requirements.get('expiry_weeks'):
                        # Calculate expiry date: start_date + duration_weeks
                        if isinstance(investment_start_date, str):
                            start_date = datetime.fromisoformat(investment_start_date.replace('Z', '+00:00'))
                        else:
                            start_date = investment_start_date

                        expiry_weeks = requirements['expiry_weeks']
                        expiry_date = start_date + timedelta(weeks=expiry_weeks)

                        # Calculate current week
                        now = datetime.now(start_date.tzinfo)
                        current_week = max(0, (now - start_date).days // 7)

                        # Prepare update data
                        update_data = {}

                        # Only update current_week if it's NULL
                        if investor.get('current_week') is None:
                            update_data['current_week'] = current_week

                        # Only update investment_expiry_date if it's NULL
                        if investor.get('investment_expiry_date') is None:
                            update_data['investment_expiry_date'] = expiry_date.date()

                        # Update if there's data to update
                        if update_data:
                            update_data['updated_at'] = datetime.now().isoformat()

                            update_response = self.supabase.table('investors')\
                                .update(update_data)\
                                .eq('id', investor_id)\
                                .execute()

                            update_data_result = getattr(update_response, 'data', [])
                            if update_data_result:
                                processed_count += 1
                                print(f"Updated missing fields for investor {investor_id}: {update_data}")

                except Exception as e:
                    print(f"Error updating investor {investor_id}: {str(e)}")
                    continue

            if processed_count > 0:
                print(f"Background service populated missing fields for {processed_count} investors")

        except Exception as e:
            print(f"Error in background field population service: {str(e)}")
