"""
Referral service for managing affiliate network and points system.
Handles referral code generation, validation, points awarding, and redemptions.
"""

import random
import string
from typing import Dict, Any, Optional, List
from datetime import datetime, date
from ..core.config import settings
from .notification_service import NotificationService
from .transaction_service import TransactionService
from .interest_calculation_service import InterestCalculationService

try:
    from supabase import create_client
except Exception:
    create_client = None


class ReferralService:
    """Service for managing referral codes, points, and affiliate network."""

    POINTS_PER_REFERRAL = 10
    POINTS_TO_NAIRA_RATE = 500  # 1 point = 500 Naira
    MIN_REDEMPTION_POINTS = 20
    MAX_MONTHLY_REDEMPTIONS = 1

    def __init__(self):
        if create_client is None:
            raise RuntimeError("supabase package not installed")

        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise RuntimeError("Supabase config missing in settings")

        self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    def generate_referral_code(self) -> str:
        """Generate a unique 8-character referral code."""
        while True:
            # Generate 8-character alphanumeric code
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

            # Check if code already exists
            response = self.supabase.table('users').select('id').eq('referral_code', code).execute()
            data = getattr(response, 'data', [])

            if not data:  # Code is unique
                return code

    def create_user_points_record(self, user_id: str) -> Dict[str, Any]:
        """Create initial points record for a new user."""
        try:
            points_data = {
                'user_id': user_id,
                'points_balance': 0,
                'total_points_earned': 0,
                'total_points_redeemed': 0,
                'last_redemption_date': None,
                'monthly_redemption_count': 0,
                'last_redemption_month': None
            }

            response = self.supabase.table('user_points').insert(points_data).execute()
            data = getattr(response, 'data', [])
            error = getattr(response, 'error', None)

            if data:
                return {'success': True, 'data': data[0]}
            else:
                return {'success': False, 'error': f'Failed to create points record: {error}'}

        except Exception as e:
            return {'success': False, 'error': f'Error creating points record: {str(e)}'}

    def assign_referral_code_to_user(self, user_id: str) -> Dict[str, Any]:
        """Generate and assign a unique referral code to a user."""
        try:
            referral_code = self.generate_referral_code()

            # Update user with referral code
            response = self.supabase.table('users').update({
                'referral_code': referral_code
            }).eq('id', user_id).execute()

            data = getattr(response, 'data', [])
            error = getattr(response, 'error', None)

            if data:
                # Create initial points record
                points_result = self.create_user_points_record(user_id)
                if not points_result['success']:
                    return points_result

                return {
                    'success': True,
                    'referral_code': referral_code,
                    'message': 'Referral code assigned successfully'
                }
            else:
                return {'success': False, 'error': f'Failed to assign referral code: {error}'}

        except Exception as e:
            return {'success': False, 'error': f'Error assigning referral code: {str(e)}'}

    def validate_referral_code(self, referral_code: str, user_email: str = None) -> Dict[str, Any]:
        """Validate a referral code and return referrer information."""
        try:
            if not referral_code or len(referral_code.strip()) == 0:
                return {'success': False, 'error': 'Referral code is required'}

            # Clean the code
            code = referral_code.strip().upper()

            # Check if code exists
            response = self.supabase.table('users').select('id, email, first_name, surname').eq('referral_code', code).execute()
            data = getattr(response, 'data', [])

            if not data:
                return {'success': False, 'error': 'Invalid referral code'}

            referrer = data[0]

            # Check if user is trying to use their own code
            if user_email and referrer['email'] == user_email:
                return {'success': False, 'error': 'You cannot use your own referral code'}

            return {
                'success': True,
                'referrer': referrer,
                'message': 'Referral code is valid'
            }

        except Exception as e:
            return {'success': False, 'error': f'Error validating referral code: {str(e)}'}

    def record_referral_usage(self, referrer_id: str, referee_id: str, referral_code: str) -> Dict[str, Any]:
        """Record when a referral code is used during signup."""
        try:
            referral_data = {
                'referrer_id': referrer_id,
                'referee_id': referee_id,
                'referral_code_used': referral_code.upper(),
                'points_awarded': 0,  # Points awarded later when investor account is created
                'investor_account_created': False
            }

            response = self.supabase.table('user_referrals').insert(referral_data).execute()
            data = getattr(response, 'data', [])
            error = getattr(response, 'error', None)

            if data:
                return {'success': True, 'data': data[0]}
            else:
                return {'success': False, 'error': f'Failed to record referral: {error}'}

        except Exception as e:
            return {'success': False, 'error': f'Error recording referral: {str(e)}'}

    def award_referral_points(self, referee_email: str) -> Dict[str, Any]:
        """Award points to referrer when referee creates an investor account."""
        try:
            # Find the referral record
            referral_response = self.supabase.table('user_referrals').select('*').eq('referee_id', referee_email).execute()
            referral_data = getattr(referral_response, 'data', [])

            if not referral_data:
                return {'success': False, 'error': 'No referral record found'}

            referral = referral_data[0]

            if referral['investor_account_created']:
                return {'success': False, 'error': 'Points already awarded for this referral'}

            referrer_id = referral['referrer_id']

            # Update referral record
            update_response = self.supabase.table('user_referrals').update({
                'investor_account_created': True,
                'points_awarded': self.POINTS_PER_REFERRAL
            }).eq('id', referral['id']).execute()

            # Update referrer's points
            points_response = self.supabase.table('user_points').select('*').eq('user_id', referrer_id).execute()
            points_data = getattr(points_response, 'data', [])

            if points_data:
                current_points = points_data[0]
                new_balance = current_points['points_balance'] + self.POINTS_PER_REFERRAL
                new_total_earned = current_points['total_points_earned'] + self.POINTS_PER_REFERRAL

                self.supabase.table('user_points').update({
                    'points_balance': new_balance,
                    'total_points_earned': new_total_earned
                }).eq('user_id', referrer_id).execute()

                # Generate notification
                notification = NotificationService.generate_referral_points_earned_notification(
                    investor_id=referrer_id,
                    points=self.POINTS_PER_REFERRAL
                )

                return {
                    'success': True,
                    'points_awarded': self.POINTS_PER_REFERRAL,
                    'new_balance': new_balance,
                    'notification': notification
                }
            else:
                return {'success': False, 'error': 'Referrer points record not found'}

        except Exception as e:
            return {'success': False, 'error': f'Error awarding referral points: {str(e)}'}

    def get_user_points(self, user_id: str) -> Dict[str, Any]:
        """Get user's current points balance and statistics."""
        try:
            response = self.supabase.table('user_points').select('*').eq('user_id', user_id).execute()
            data = getattr(response, 'data', [])

            if data:
                points_data = data[0]
                return {
                    'success': True,
                    'points_balance': points_data['points_balance'],
                    'total_points_earned': points_data['total_points_earned'],
                    'total_points_redeemed': points_data['total_points_redeemed'],
                    'last_redemption_date': points_data['last_redemption_date'],
                    'monthly_redemption_count': points_data['monthly_redemption_count'],
                    'last_redemption_month': points_data['last_redemption_month']
                }
            else:
                # Create points record if it doesn't exist
                create_result = self.create_user_points_record(user_id)
                if create_result['success']:
                    return {
                        'success': True,
                        'points_balance': 0,
                        'total_points_earned': 0,
                        'total_points_redeemed': 0,
                        'last_redemption_date': None,
                        'monthly_redemption_count': 0,
                        'last_redemption_month': None
                    }
                else:
                    return create_result

        except Exception as e:
            return {'success': False, 'error': f'Error getting user points: {str(e)}'}

    def get_referral_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user's referral statistics."""
        try:
            # Get referral count and points earned
            referrals_response = self.supabase.table('user_referrals').select('*').eq('referrer_id', user_id).execute()
            referrals_data = getattr(referrals_response, 'data', [])

            total_referrals = len(referrals_data) if referrals_data else 0
            successful_referrals = len([r for r in referrals_data if r['investor_account_created']]) if referrals_data else 0
            total_points_earned = sum(r['points_awarded'] for r in referrals_data) if referrals_data else 0

            return {
                'success': True,
                'total_referrals': total_referrals,
                'successful_referrals': successful_referrals,
                'total_points_earned': total_points_earned
            }

        except Exception as e:
            return {'success': False, 'error': f'Error getting referral stats: {str(e)}'}

    def get_downlines(self, user_id: str) -> Dict[str, Any]:
        """Get user's referral downlines."""
        try:
            response = self.supabase.table('user_referrals').select('*, users!referee_id(email, first_name, surname, created_at)').eq('referrer_id', user_id).execute()
            data = getattr(response, 'data', [])

            downlines = []
            if data:
                for referral in data:
                    user_info = referral.get('users', {})
                    downlines.append({
                        'id': referral['referee_id'],
                        'email': user_info.get('email', ''),
                        'name': f"{user_info.get('first_name', '')} {user_info.get('surname', '')}".strip(),
                        'joined_date': user_info.get('created_at', ''),
                        'investor_account_created': referral['investor_account_created'],
                        'points_awarded': referral['points_awarded'],
                        'referral_date': referral['created_at']
                    })

            return {'success': True, 'downlines': downlines}

        except Exception as e:
            return {'success': False, 'error': f'Error getting downlines: {str(e)}'}

    def can_redeem_points(self, user_id: str, points_to_redeem: int) -> Dict[str, Any]:
        """Check if user can redeem the specified number of points."""
        try:
            # Get user points
            points_result = self.get_user_points(user_id)
            if not points_result['success']:
                return points_result

            points_data = points_result

            # Check minimum points
            if points_to_redeem < self.MIN_REDEMPTION_POINTS:
                return {
                    'success': False,
                    'error': f'Minimum redemption is {self.MIN_REDEMPTION_POINTS} points'
                }

            # Check balance
            if points_to_redeem > points_data['points_balance']:
                return {
                    'success': False,
                    'error': 'Insufficient points balance'
                }

            # Check monthly limit
            current_month = date.today().replace(day=1)
            last_redemption_month = points_data['last_redemption_month']

            if last_redemption_month:
                last_month = datetime.strptime(last_redemption_month, '%Y-%m-%d').date().replace(day=1)
                if last_month == current_month and points_data['monthly_redemption_count'] >= self.MAX_MONTHLY_REDEMPTIONS:
                    return {
                        'success': False,
                        'error': 'Monthly redemption limit reached. Try again next month.'
                    }

            return {'success': True, 'message': 'Redemption allowed'}

        except Exception as e:
            return {'success': False, 'error': f'Error checking redemption eligibility: {str(e)}'}

    def redeem_points(self, user_id: str, points_to_redeem: int) -> Dict[str, Any]:
        """Redeem points and add equivalent amount to spending account."""
        try:
            # Validate redemption
            can_redeem = self.can_redeem_points(user_id, points_to_redeem)
            if not can_redeem['success']:
                return can_redeem

            # Calculate amount in Naira
            amount_in_naira = points_to_redeem * self.POINTS_TO_NAIRA_RATE

            # Get current month for tracking
            current_date = date.today()
            current_month = current_date.replace(day=1)

            # Update user points
            points_response = self.supabase.table('user_points').select('*').eq('user_id', user_id).execute()
            points_data = getattr(points_response, 'data', [])

            if not points_data:
                return {'success': False, 'error': 'Points record not found'}

            current_points = points_data[0]
            new_balance = current_points['points_balance'] - points_to_redeem
            new_total_redeemed = current_points['total_points_redeemed'] + points_to_redeem

            # Update monthly redemption count
            monthly_count = 1
            last_redemption_month = current_points['last_redemption_month']

            if last_redemption_month:
                last_month = datetime.strptime(last_redemption_month, '%Y-%m-%d').date().replace(day=1)
                if last_month == current_month:
                    monthly_count = current_points['monthly_redemption_count'] + 1

            update_data = {
                'points_balance': new_balance,
                'total_points_redeemed': new_total_redeemed,
                'last_redemption_date': current_date.isoformat(),
                'monthly_redemption_count': monthly_count,
                'last_redemption_month': current_month.isoformat()
            }

            self.supabase.table('user_points').update(update_data).eq('user_id', user_id).execute()

            # Add amount to spending account via transaction service
            transaction_service = TransactionService()

            # Get user email for transaction
            user_response = self.supabase.table('users').select('email').eq('id', user_id).execute()
            user_data = getattr(user_response, 'data', [])

            if not user_data:
                return {'success': False, 'error': 'User not found'}

            user_email = user_data[0]['email']

            # Get investor ID
            investor_response = self.supabase.table('investors').select('id').eq('email', user_email).execute()
            investor_data = getattr(investor_response, 'data', [])

            if not investor_data:
                return {'success': False, 'error': 'Investor account not found'}

            investor_id = investor_data[0]['id']

            # Record redemption transaction
            transaction_data = {
                'investor_id': investor_id,
                'amount': amount_in_naira,
                'description': f'Points redemption: {points_to_redeem} points converted to ₦{amount_in_naira:,}'
            }

            transaction_result = transaction_service.record_points_redemption_transaction(transaction_data)

            # Debug logging
            print(f"DEBUG: Transaction creation result: success={transaction_result.get('success')}, error={transaction_result.get('error')}")

            if not transaction_result['success']:
                # Rollback points deduction since transaction recording failed
                rollback_update_data = {
                    'points_balance': current_points['points_balance'],  # Restore original balance
                    'total_points_redeemed': current_points['total_points_redeemed'],  # Restore original redeemed count
                    'last_redemption_date': current_points['last_redemption_date'],  # Restore original date
                    'monthly_redemption_count': current_points['monthly_redemption_count'],  # Restore original count
                    'last_redemption_month': current_points['last_redemption_month']  # Restore original month
                }
                self.supabase.table('user_points').update(rollback_update_data).eq('user_id', user_id).execute()
                print(f"DEBUG: Rolled back points for user_id={user_id} due to transaction failure")
                return {'success': False, 'error': 'Failed to process redemption transaction'}

            # Credit spending account with redemption amount
            print(f"DEBUG: About to credit spending account for investor_id={investor_id}, amount={amount_in_naira}")
            interest_service = InterestCalculationService()
            spending_result = interest_service.update_spending_account(investor_id, amount_in_naira)

            # Debug logging
            print(f"DEBUG: Spending account update result: success={spending_result.get('success')}, error={spending_result.get('error')}")

            if not spending_result['success']:
                # Rollback points deduction and transaction since spending account credit failed
                rollback_update_data = {
                    'points_balance': current_points['points_balance'],  # Restore original balance
                    'total_points_redeemed': current_points['total_points_redeemed'],  # Restore original redeemed count
                    'last_redemption_date': current_points['last_redemption_date'],  # Restore original date
                    'monthly_redemption_count': current_points['monthly_redemption_count'],  # Restore original count
                    'last_redemption_month': current_points['last_redemption_month']  # Restore original month
                }
                self.supabase.table('user_points').update(rollback_update_data).eq('user_id', user_id).execute()

                # TODO: Delete transaction record if possible (though this might be complex)
                # For now, the transaction record will remain as audit trail of the failed attempt

                return {'success': False, 'error': f'Failed to credit spending account: {spending_result.get("error", "Unknown error")}'}

            # Generate notification
            notification = NotificationService.generate_points_redeemed_notification(
                investor_id=investor_id,
                points=points_to_redeem,
                amount=amount_in_naira
            )

            return {
                'success': True,
                'points_redeemed': points_to_redeem,
                'amount_added': amount_in_naira,
                'spending_balance': spending_result['new_balance'],  # Include new spending balance
                'points_balance': new_balance,
                'notification': notification
            }

        except Exception as e:
            return {'success': False, 'error': f'Error redeeming points: {str(e)}'}
