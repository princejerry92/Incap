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
