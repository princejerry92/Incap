"""
Admin Service
Handles business logic for admin operations.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from ..core.config import settings
from .interest_calculation_service import InterestCalculationService

try:
    from supabase import create_client
except Exception:
    create_client = None

class AdminService:
    def __init__(self):
        if create_client is None:
            raise RuntimeError("supabase package not installed")
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise RuntimeError("Supabase config missing in settings")
        self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    def get_all_investors(self, search_query: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch all investors with their due dates and status.
        Supports search by email.
        """
        try:
            query = self.supabase.table('investors').select('*')
            
            if search_query:
                # Efficient search using ILIKE
                query = query.ilike('email', f'%{search_query}%')
            
            response = query.order('created_at', desc=True).execute()
            investors = getattr(response, 'data', [])
            
            # Enrich with due date info if needed, though it's in the table
            # We might want to calculate "current week" dynamically if it's not up to date,
            # but for admin view, raw DB data is usually preferred unless we trigger an update.
            
            return {
                'success': True,
                'data': investors,
                'count': len(investors)
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def get_payments_summary(self, search_query: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch investment totals and payment status for each investor.
        """
        try:
            query = self.supabase.table('investors').select(
                'id, first_name, surname, email, initial_investment, total_investment, total_paid, paystack_reference, payment_status'
            )
            
            if search_query:
                query = query.ilike('email', f'%{search_query}%')
                
            response = query.order('created_at', desc=True).execute()
            investors = getattr(response, 'data', [])
            
            summary = []
            for inv in investors:
                summary.append({
                    'id': inv.get('id'),
                    'name': f"{inv.get('first_name', '')} {inv.get('surname', '')}",
                    'email': inv.get('email'),
                    'initial_investment': float(inv.get('initial_investment', 0)),
                    'total_investment': float(inv.get('total_investment', 0) or inv.get('initial_investment', 0)),
                    'total_paid': float(inv.get('total_paid', 0)),
                    'payment_status': inv.get('payment_status'),
                    'paystack_ref': inv.get('paystack_reference')
                })
                
            return {
                'success': True,
                'data': summary,
                'count': len(summary)
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def get_portfolio_details(self, search_query: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch detailed portfolio info for investors.
        """
        try:
            query = self.supabase.table('investors').select(
                'id, first_name, surname, email, phone, '
                'investment_type, portfolio_type, '
                'account_number, bank_account_number, bank_account_name, bank_name, '
                'identity_type, identity_number'
            )
            
            if search_query:
                query = query.ilike('email', f'%{search_query}%')
                
            response = query.order('created_at', desc=True).execute()
            investors = getattr(response, 'data', [])
            
            # Map 'phone' to 'phone_number' for frontend consistency if needed, or just pass as is
            # The frontend expects 'phone_number' in the table display? 
            # Let's check AdminPortfolio.js: it uses `p.phone_number`.
            # So we should map it.
            
            mapped_investors = []
            for inv in investors:
                inv['phone_number'] = inv.get('phone') # Map for frontend
                mapped_investors.append(inv)
            
            return {
                'success': True,
                'data': mapped_investors,
                'count': len(mapped_investors)
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def update_investor_portfolio(self, investor_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update investor portfolio details.
        """
        try:
            # Allowed fields to update
            # Map frontend 'phone_number' back to 'phone' if present
            if 'phone_number' in update_data:
                update_data['phone'] = update_data.pop('phone_number')

            allowed_fields = [
                'first_name', 'surname', 'phone',
                'investment_type', 'portfolio_type',
                'account_number', 'bank_account_number', 'bank_account_name', 'bank_name',
                'identity_type', 'identity_number'
            ]
            
            data_to_update = {k: v for k, v in update_data.items() if k in allowed_fields}
            
            if not data_to_update:
                return {'success': False, 'error': 'No valid fields to update'}
                
            data_to_update['updated_at'] = datetime.now().isoformat()
            
            response = self.supabase.table('investors').update(data_to_update).eq('id', investor_id).execute()
            updated_data = getattr(response, 'data', [])
            
            if updated_data:
                # Map back for response
                res_data = updated_data[0]
                res_data['phone_number'] = res_data.get('phone')
                return {'success': True, 'data': res_data}
            else:
                return {'success': False, 'error': 'Failed to update investor'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def get_customer_care_queries(self, search_query: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch all customer care queries with user stats.
        """
        try:
            # Fetch queries
            query = self.supabase.table('customer_queries').select('*')
            
            # Note: Search on joined table is hard in Supabase-py without complex queries or views.
            # We'll fetch queries first, then enrich. If search_query is provided, we might need to filter manually or use a view.
            # For efficiency with search, let's assume we search by query ID or status for now, 
            # OR we fetch user IDs matching the email first.
            
            user_ids = []
            if search_query:
                # Find users matching email
                user_res = self.supabase.table('users').select('id').ilike('email', f'%{search_query}%').execute()
                users = getattr(user_res, 'data', [])
                user_ids = [u['id'] for u in users]
                
                if not user_ids:
                    return {'success': True, 'data': [], 'count': 0}
                
                query = query.in_('user_id', user_ids)
            
            response = query.order('created_at', desc=True).execute()
            queries = getattr(response, 'data', [])
            
            # Enrich with user details (points, referrals)
            enriched_queries = []
            
            # Get all unique user IDs from queries to batch fetch users
            all_query_user_ids = list(set(q['user_id'] for q in queries))
            
            users_map = {}
            if all_query_user_ids:
                u_res = self.supabase.table('users').select('id, email, first_name, surname, referral_code').in_('id', all_query_user_ids).execute()
                u_data = getattr(u_res, 'data', [])
                users_map = {u['id']: u for u in u_data}
                
            # Get points (this might be N+1 if we don't have a bulk fetch, but let's assume low volume for now or optimize later)
            # We can fetch all points for these users
            points_map = {}
            if all_query_user_ids:
                p_res = self.supabase.table('user_points').select('user_id, total_points').in_('user_id', all_query_user_ids).execute()
                p_data = getattr(p_res, 'data', [])
                points_map = {p['user_id']: p.get('total_points', 0) for p in p_data}

            for q in queries:
                user = users_map.get(q['user_id'], {})
                enriched_queries.append({
                    **q,
                    'user_email': user.get('email'),
                    'user_name': f"{user.get('first_name', '')} {user.get('surname', '')}",
                    'user_points': points_map.get(q['user_id'], 0),
                    'user_referral_code': user.get('referral_code')
                })
                
            return {
                'success': True,
                'data': enriched_queries,
                'count': len(enriched_queries)
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def update_customer_care_query(self, query_id: str, status: str, admin_response: Optional[str] = None) -> Dict[str, Any]:
        """
        Update customer query status and add admin response.
        """
        try:
            update_data = {
                'status': status,
                'updated_at': datetime.now().isoformat()
            }
            if admin_response:
                update_data['admin_response'] = admin_response
                
            response = self.supabase.table('customer_queries').update(update_data).eq('id', query_id).execute()
            updated_data = getattr(response, 'data', [])
            
            if updated_data:
                return {'success': True, 'data': updated_data[0]}
            else:
                return {'success': False, 'error': 'Failed to update query'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def check_investment_data_integrity(self) -> Dict[str, Any]:
        """
        Check for investors with data inconsistencies.
        Checks:
        1. total_investment not set (but initial_investment > 0)
        2. last_due_date is NULL (and week > 0)
        3. next_due_date consistency with investment_start_date and current_week
        4. investment_expiry_date missing
        """
        try:
            response = self.supabase.table('investors').select('*').execute()
            investors = getattr(response, 'data', [])

            issues = []
            now = datetime.now()

            for investor in investors:
                investor_id = investor['id']
                email = investor.get('email')
                initial = float(investor.get('initial_investment', 0) or 0)
                total = float(investor.get('total_investment', 0) or 0)
                portfolio_type = investor.get('portfolio_type')
                investment_type = investor.get('investment_type')
                start_date_str = investor.get('investment_start_date')
                last_due_date = investor.get('last_due_date')
                next_due_date = investor.get('next_due_date')
                expiry_date = investor.get('investment_expiry_date')
                current_week = int(investor.get('current_week', 0))

                # Check 1: Total Investment Missing
                if initial > 0 and total <= 0:
                    issues.append({
                        'investor_id': investor_id,
                        'email': email,
                        'issue': 'total_investment_not_set',
                        'details': f"Initial: {initial}, Total: {total}"
                    })
                    continue

                # Skip further checks if no active investment
                if not investment_type or not start_date_str:
                    continue

                # Parse start date
                # Handle potential timezone formats
                if isinstance(start_date_str, str):
                    start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
                    # Ensure offset-naive for simple calculation if needed, or keep aware.
                    # Standardizing on offset-naive for 'now' diff usually easier if we stick to one convention.
                    # But better to make 'now' aware or 'start_date' naive.
                    # Let's make 'now' aware if start_date is aware.
                    if start_date.tzinfo:
                         now_aware = datetime.now(start_date.tzinfo)
                         days_diff = (now_aware - start_date).days
                    else:
                         days_diff = (now - start_date).days
                else:
                    days_diff = 0 # Should not happen if str
                
                calculated_weeks_elapsed = days_diff // 7

                # Check 2: Week Mismatch (allowing 1 week drift for payment processing time)
                # If calculated week is significantly different from current_week
                # Strict check: if calculated > current_week, it means they missed payments or cron didn't run.
                # identifying this as an integrity issue to be safe.
                if calculated_weeks_elapsed > current_week + 1:
                     issues.append({
                        'investor_id': investor_id,
                        'email': email,
                        'issue': 'timeline_mismatch',
                        'details': f"Calculated Weeks: {calculated_weeks_elapsed}, DB Week: {current_week}"
                    })

                # Check 3: Missing Expiry Date
                if not expiry_date:
                    issues.append({
                        'investor_id': investor_id,
                        'email': email,
                        'issue': 'missing_expiry_date',
                        'details': "Investment expiry date is NULL"
                    })

                # Check 4: Missing Dates (Null Last Due Date when Week > 0)
                if current_week > 0 and not last_due_date:
                     issues.append({
                        'investor_id': investor_id,
                        'email': email,
                        'issue': 'missing_last_due_date',
                        'details': f"Week is {current_week} but last_due_date is NULL"
                    })

            return {'success': True, 'issues_found': len(issues), 'issues': issues}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def fix_investor_data_integrity(self, investor_id: str) -> Dict[str, Any]:
        """
        Fix data integrity for a specific investor.
        Recalculates total_investment, expiry_date, and realigns weeks/due dates based on start_date.
        """
        try:
            # 1. Fetch Investor
            response = self.supabase.table('investors').select('*').eq('id', investor_id).execute()
            data = getattr(response, 'data', [])
            if not data:
                return {'success': False, 'error': 'Investor not found'}
            
            investor = data[0]
            
            # 2. Key Data
            initial = float(investor.get('initial_investment', 0) or 0)
            total = float(investor.get('total_investment', 0) or 0)
            portfolio_type = investor.get('portfolio_type')
            investment_type = investor.get('investment_type')
            start_date_str = investor.get('investment_start_date')
            
            updates = {}
            
            # 3. Fix Total Investment
            if initial > 0 and total <= 0:
                updates['total_investment'] = initial
                
            # 4. Realign Timeline (Dates & Weeks) if investment is active
            if investment_type and start_date_str:
                from .portfolio_service import PortfolioService
                portfolio_service = PortfolioService()
                
                # Parse Start Date
                start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
                
                # Calculate Expiry
                expiry_date = portfolio_service.get_investment_expiry_date(portfolio_type, investment_type, start_date)
                if expiry_date:
                    updates['investment_expiry_date'] = expiry_date.isoformat()
                
                # Recalculate Current Week
                now = datetime.now(start_date.tzinfo)
                days_elapsed = (now - start_date).days
                weeks_elapsed = days_elapsed // 7
                
                # Update week
                updates['current_week'] = weeks_elapsed
                
                # Reconstruct Due Dates
                # Validation: Don't set future dates if they exceeded expiry
                # Rule: 
                # last_due_date = start_date + (weeks_elapsed * 7 days) [The most recent due date]
                # next_due_date = last_due_date + 7 days
                
                from datetime import timedelta
                
                recalc_last_due = start_date + timedelta(weeks=weeks_elapsed)
                recalc_next_due = recalc_last_due + timedelta(days=7)
                
                # If next due date is past expiry, it should be None (or handled by status completion)
                if expiry_date and recalc_next_due > expiry_date:
                     updates['next_due_date'] = None
                else:
                     updates['next_due_date'] = recalc_next_due.isoformat()
                
                updates['last_due_date'] = recalc_last_due.isoformat()

            if updates:
                updates['updated_at'] = datetime.now().isoformat()
                self.supabase.table('investors').update(updates).eq('id', investor_id).execute()
                return {'success': True, 'updates': updates}
            else:
                return {'success': True, 'message': 'No updates needed'}

        except Exception as e:
            return {'success': False, 'error': str(e)}

    def trigger_interest_payment_job(self) -> Dict[str, Any]:
        """
        Manually trigger the interest payment cron job.
        Wraps the service call.
        """
        try:
             service = InterestCalculationService()
             return service.check_and_process_all_due_dates()
        except Exception as e:
             return {'success': False, 'error': str(e)}

    def get_missed_payments_summary(self) -> Dict[str, Any]:
        """
        Get a summary of all investors who have missed payments.
        """
        try:
            # 1. Fetch all active investors (optimize by filtering if possible, but calculating missed requires logic)
            response = self.supabase.table('investors').select('*').neq('status', 'completed').execute()
            investors = getattr(response, 'data', [])
            
            summary = []
            service = InterestCalculationService()
            
            for investor in investors:
                # We can calculate missed payments using the service
                # Note: This might be N+1 queries if we are not careful, but acceptable for admin dashboard volume
                result = service.calculate_missed_payments(investor['id'])
                
                if result['success'] and result.get('missed_payments', 0) > 0:
                    summary.append({
                        'investor_id': investor['id'],
                        'first_name': investor.get('first_name'),
                        'surname': investor.get('surname'),
                        'email': investor.get('email'),
                        'missed_payments': result['missed_payments'],
                        'weeks_elapsed': result.get('weeks_elapsed'),
                        'payment_counter': result.get('payment_counter'),
                        'total_investment': investor.get('total_investment')
                    })
            
            return {
                'success': True,
                'data': summary,
                'count': len(summary)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def process_missed_payment_catchup(self, investor_id: str) -> Dict[str, Any]:
        """
        Trigger catch-up for a single investor.
        """
        try:
            service = InterestCalculationService()
            return service.admin_catch_up_missed_payments(investor_id)
        except Exception as e:
             return {'success': False, 'error': str(e)}
