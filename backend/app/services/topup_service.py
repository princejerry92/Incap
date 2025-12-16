from typing import Dict, Any, Optional
from datetime import datetime
import uuid
import logging
from .transaction_service import TransactionService
from .paystack_service import paystack_service
from .notification_service import NotificationService
from ..core.config import settings

logger = logging.getLogger(__name__)

class TopUpService:
    def __init__(self):
        self.transaction_service = TransactionService()
        self.paystack_service = paystack_service

    def initiate_topup(self, investor_id: str, amount: float, payment_method: str = "paystack") -> Dict[str, Any]:
        """Initiate a top-up request"""
        try:
            # Check if Supabase client is initialized
            if self.transaction_service.supabase is None:
                return {'success': False, 'error': 'Supabase client not initialized'}

            # Get investor details
            investor_resp = self.transaction_service.supabase.table('investors').select('*').eq('id', investor_id).execute()
            investor_data = getattr(investor_resp, 'data', [])

            if not investor_data:
                return {'success': False, 'error': 'Investor not found'}

            investor = investor_data[0]

            # Check if top-up is blocked due to proximity to due date
            next_due_date = investor.get('next_due_date')
            if next_due_date:
                from datetime import datetime, timedelta
                current_time = datetime.now()
                if isinstance(next_due_date, str):
                    due_date = datetime.fromisoformat(next_due_date.replace('Z', '+00:00'))
                else:
                    due_date = next_due_date

                # Block top-ups if within 3 days of due date
                if due_date - current_time <= timedelta(days=3):
                    return {'success': False, 'error': 'Top-ups are not allowed within 3 days of the due date to prevent interest manipulation'}
            
            # Create top-up record
            topup_record = {
                'investor_id': investor_id,
                'amount': amount,
                'paystack_reference': None,
                'paystack_status': 'pending',
                'transaction_id': f"TOPUP-{uuid.uuid4().hex[:12].upper()}",
                'payment_method': payment_method,
                'description': f"Top-up for {investor.get('investment_type', 'Investment')}"
            }
            
            # Initialize Paystack payment
            paystack_response = self.paystack_service.initialize_transaction(
                email=investor.get('email'),
                amount=int(amount * 100),  # Amount in kobo
                reference=topup_record['transaction_id'],
                callback_url=f"{settings.FRONTEND_URL}/topup/callback"
            )
            
            if paystack_response['status']:
                topup_record['paystack_reference'] = paystack_response['data']['reference']
                # Insert top-up record
                resp = self.transaction_service.supabase.table('topups').insert(topup_record).execute()
                data: Any | list[Any] = getattr(resp, 'data', [])
                
                if data:
                    return {
                        'success': True,
                        'data': data[0],
                        'paystack_url': paystack_response['data']['authorization_url']
                    }
                else:
                    return {'success': False, 'error': 'Failed to create top-up record'}
            else:
                return {'success': False, 'error': 'Failed to initialize Paystack payment'}
                
        except Exception as e:
            return {'success': False, 'error': f'Error initiating top-up: {str(e)}'}
    
    def process_paystack_callback(self, reference: str, status: str) -> Dict[str, Any]:
        """Process Paystack callback for top-up payment"""
        try:
            logger.info(f"Processing Paystack callback for reference: {reference}, status: {status}")

            # Check if Supabase client is initialized
            if self.transaction_service.supabase is None:
                logger.error("Supabase client not initialized")
                return {'success': False, 'error': 'Supabase client not initialized'}

            # Check for idempotency - if a transaction with this reference already exists, skip processing
            logger.info(f"Checking for existing transaction with paystack_ref: {reference}")
            existing_transaction_resp = self.transaction_service.supabase.table('transactions').select('id').eq('paystack_ref', reference).execute()
            existing_transaction_data = getattr(existing_transaction_resp, 'data', [])

            if existing_transaction_data:
                logger.info(f"Transaction with paystack_ref {reference} already processed, skipping duplicate callback")
                return {'success': True, 'message': 'Callback already processed'}

            # Get top-up record
            logger.info(f"Fetching topup record with paystack_reference: {reference}")
            topup_resp = self.transaction_service.supabase.table('topups').select('*').eq('paystack_reference', reference).execute()
            topup_data = getattr(topup_resp, 'data', [])

            if not topup_data:
                logger.error(f"Top-up record not found for reference: {reference}")
                return {'success': False, 'error': 'Top-up record not found'}

            topup = topup_data[0]
            logger.info(f"Found topup record: {topup}")
            
            # Verify transaction with Paystack to get actual status
            logger.info(f"Verifying transaction with Paystack for reference: {reference}")
            verification_result = self.paystack_service.verify_transaction(reference)
            logger.info(f"Paystack verification result: {verification_result}")
            
            # Determine actual status from verification
            actual_status = 'failed'
            if verification_result.get('status') and verification_result.get('data', {}).get('status') == 'success':
                actual_status = 'success'
                
            logger.info(f"Actual transaction status: {actual_status}")
            
            # Update top-up status
            update_data = {
                'paystack_status': actual_status,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            update_resp = self.transaction_service.supabase.table('topups').update(update_data).eq('id', topup['id']).execute()
            
            if actual_status == 'success':
                logger.info(f"Processing successful topup for investor_id: {topup['investor_id']}")
                
                # Update investor's total investment
                investor_resp = self.transaction_service.supabase.table('investors').select('initial_investment, total_investment, email, account_number, portfolio_type, investment_type').eq('id', topup['investor_id']).execute()
                investor_data = getattr(investor_resp, 'data', [])
                
                if investor_data:
                    investor = investor_data[0]
                    logger.info(f"Found investor data: {investor}")
                    
                    current_initial = float(investor.get('initial_investment', 0) or 0)
                    current_total = float(investor.get('total_investment', 0) or 0)
                    topup_amount = float(topup['amount'])
                    
                    logger.info(f"Current initial: {current_initial}, current total: {current_total}, topup amount: {topup_amount}")
                    
                    # Update both total investment and initial_investment
                    # This ensures that the initial_investment reflects the total capital invested (original + top-ups)
                    # allowing the user to qualify for higher portfolio tiers and see the correct principal amount.
                    new_total = current_total + topup_amount
                    new_initial = current_initial + topup_amount

                    logger.info(f"New total: {new_total}, New initial: {new_initial}")

                    investor_update = {
                        'total_investment': new_total,
                        'initial_investment': new_initial,
                        'updated_at': datetime.utcnow().isoformat()
                    }
                    
                    update_result = self.transaction_service.supabase.table('investors').update(investor_update).eq('id', topup['investor_id']).execute()
                    logger.info(f"Investor update result: {update_result}")
                    
                    # Create a transaction record for the top-up
                    transaction_record = {
                        'email': investor.get('email'),
                        'account_number': investor.get('account_number'),
                        'initial_balance': new_initial,  # Updated initial balance
                        'portfolio_type': investor.get('portfolio_type'),
                        'investment_type': investor.get('investment_type'),
                        'amount_due': 0,  # Will be calculated separately
                        'last_due_date': None,
                        'next_due_date': None,
                        'total_paid': 0,
                        'withdrawal_requested': False,
                        'withdraw_status': 'none',
                        'failure_reason': None,
                        'transaction_id': f"TOPUP-TRANS-{uuid.uuid4().hex[:12].upper()}",
                        'paystack_ref': reference,
                        'paystack_status': actual_status,
                        'transaction_type': 'topup',
                        'amount': topup_amount,
                        'withdrawal_timestamp': None,
                        'paystack_timestamp': datetime.utcnow().isoformat(),
                        'investor_id': topup['investor_id']
                    }
                    
                    transaction_result = self.transaction_service.supabase.table('transactions').insert(transaction_record).execute()
                    logger.info(f"Transaction insert result: {transaction_result}")
                    
                    # Generate top-up notification and persist it
                    notification = NotificationService.generate_topup_completed_notification(
                        investor_id=topup['investor_id'],
                        amount=topup_amount
                    )
                    
                    # Persist the notification in the database
                    try:
                        from .notification_persistence_service import NotificationPersistenceService
                        notification_service = NotificationPersistenceService()
                        persist_result = notification_service.create_notification(
                            investor_id=topup['investor_id'],
                            title=notification['title'],
                            message=notification['message'],
                            notification_type=notification['type'],
                            event_type=notification['eventType'],
                            metadata=notification.get('metadata')
                        )
                        if not persist_result.get('success'):
                            logger.error(f"Failed to persist notification: {persist_result.get('error')}")
                        else:
                            logger.info(f"Notification persisted successfully for top-up {topup['id']}")
                    except Exception as persist_error:
                        logger.error(f"Exception while persisting notification: {persist_error}")

                    # Log success
                    logger.info(f"Successfully updated investor {topup['investor_id']} with top-up amount {topup_amount}")
                else:
                    logger.error(f"Investor not found for top-up {topup['id']}")
                    return {'success': False, 'error': 'Investor not found'}
            else:
                logger.info(f"Top-up {topup['id']} failed with status: {actual_status}")

            # Include notification in response for successful top-ups
            response_data = {'success': True, 'data': getattr(update_resp, 'data', [])}
            if actual_status == 'success' and 'notification' in locals():
                response_data['notifications'] = [notification]

            return response_data
            
        except Exception as e:
            logger.exception(f"Error processing Paystack callback: {str(e)}")
            return {'success': False, 'error': f'Error processing Paystack callback: {str(e)}'}
    
    def get_topup_history(self, investor_id: str) -> Dict[str, Any]:
        """Get top-up history for an investor"""
        try:
            # Check if Supabase client is initialized
            if self.transaction_service.supabase is None:
                return {'success': False, 'error': 'Supabase client not initialized'}
                
            resp = self.transaction_service.supabase.table('topups').select('*').eq('investor_id', investor_id).order('created_at', desc=True).execute()
            data = getattr(resp, 'data', [])
            
            return {'success': True, 'data': data}
        except Exception as e:
            return {'success': False, 'error': f'Error fetching top-up history: {str(e)}'}
