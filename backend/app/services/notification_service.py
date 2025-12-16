"""
Notification service utility for generating notification objects.
Notifications are generated on-demand and not stored in database.
"""

from datetime import datetime, timedelta
import uuid
from typing import Dict, Any, Optional


class NotificationService:
    """Service for generating notification objects that track important events."""

    @staticmethod
    def create_notification(investor_id: str, title: str, message: str, notification_type: str, event_type: str, metadata: Optional[Dict[Any, Any]] = None) -> dict:
        """
        Create a notification object.

        Args:
            investor_id: The investor ID the notification belongs to
            title: Short notification title
            message: Longer descriptive message
            notification_type: 'success', 'warning', 'error', 'info'
            event_type: Specific event identifier (e.g., 'payment_received', 'withdrawal_failed')
            metadata: Optional additional data for the event

        Returns:
            Dict containing the notification data
        """
        now = datetime.utcnow()

        notification = {
            'id': f"{event_type}_{uuid.uuid4().hex[:8]}_{int(now.timestamp())}",
            'investorId': investor_id,
            'title': title,
            'message': message,
            'type': notification_type,  # success, warning, error, info
            'eventType': event_type,
            'timestamp': now.isoformat() + 'Z',
            'expiresAt': (now + timedelta(days=30)).isoformat() + 'Z',
            'read': False
        }

        if metadata:
            notification['metadata'] = metadata

        return notification

    @staticmethod
    def generate_payment_received_notification(investor_id: str, amount: float, currency: str = 'NGN', reference: Optional[str] = None) -> dict:
        """Generate notification for successful payment receipt."""
        currency_symbol = 'N' if currency == 'NGN' else currency
        formatted_amount = f"{currency_symbol}{amount:,.0f}"

        metadata = {'amount': amount, 'currency': currency}
        if reference:
            metadata['reference'] = reference

        return NotificationService.create_notification(
            investor_id=investor_id,
            title="Payment Received",
            message=f"Your payment of {formatted_amount} has been received successfully.",
            notification_type="success",
            event_type="payment_received",
            metadata=metadata
        )

    @staticmethod
    def generate_withdrawal_requested_notification(investor_id: str, amount: float, currency: str = 'NGN') -> dict:
        """Generate notification for withdrawal request submission."""
        currency_symbol = 'N' if currency == 'NGN' else currency
        formatted_amount = f"{currency_symbol}{amount:,.0f}"

        return NotificationService.create_notification(
            investor_id=investor_id,
            title="Withdrawal Requested",
            message=f"Your withdrawal request for {formatted_amount} has been submitted and is pending approval.",
            notification_type="info",
            event_type="withdrawal_requested",
            metadata={'amount': amount, 'currency': currency}
        )

    @staticmethod
    def generate_withdrawal_completed_notification(investor_id: str, amount: float, currency: str = 'NGN') -> dict:
        """Generate notification for completed withdrawal."""
        currency_symbol = 'N' if currency == 'NGN' else currency
        formatted_amount = f"{currency_symbol}{amount:,.0f}"

        return NotificationService.create_notification(
            investor_id=investor_id,
            title="Withdrawal Completed",
            message=f"Your withdrawal request for {formatted_amount} has been processed successfully.",
            notification_type="success",
            event_type="withdrawal_completed",
            metadata={'amount': amount, 'currency': currency}
        )

    @staticmethod
    def generate_withdrawal_failed_notification(investor_id: str, amount: float, reason: str, currency: str = 'NGN') -> dict:
        """Generate notification for failed withdrawal."""
        currency_symbol = 'N' if currency == 'NGN' else currency
        formatted_amount = f"{currency_symbol}{amount:,.0f}"

        return NotificationService.create_notification(
            investor_id=investor_id,
            title="Withdrawal Failed",
            message=f"Your withdrawal request for {formatted_amount} failed: {reason}",
            notification_type="error",
            event_type="withdrawal_failed",
            metadata={'amount': amount, 'reason': reason, 'currency': currency}
        )

    @staticmethod
    def generate_account_created_notification(investor_id: str, email: str) -> dict:
        """Generate notification for new account creation."""
        return NotificationService.create_notification(
            investor_id=investor_id,
            title="Welcome to Incap Fx!",
            message="Your investment account has been created successfully. Start exploring our investment options.",
            notification_type="success",
            event_type="account_created",
            metadata={'email': email}
        )

    @staticmethod
    def generate_failed_login_notification(investor_id: str, email: str) -> dict:
        """Generate notification for failed login attempt."""
        return NotificationService.create_notification(
            investor_id=investor_id,
            title="Failed Login Attempt",
            message="A failed login attempt was detected for your account. If this wasn't you, please secure your account.",
            notification_type="warning",
            event_type="failed_login",
            metadata={'email': email}
        )

    @staticmethod
    def generate_investment_selected_notification(investor_id: str, investment_type: str, portfolio_type: str) -> dict:
        """Generate notification for investment type selection."""
        return NotificationService.create_notification(
            investor_id=investor_id,
            title="Investment Selected",
            message=f"You have successfully selected {investment_type} investment in your {portfolio_type} portfolio.",
            notification_type="success",
            event_type="investment_selected",
            metadata={'investment_type': investment_type, 'portfolio_type': portfolio_type}
        )

    @staticmethod
    def generate_interest_paid_notification(investor_id: str, amount: float, currency: str = 'NGN') -> dict:
        """Generate notification for weekly interest payment."""
        currency_symbol = 'N' if currency == 'NGN' else currency
        formatted_amount = f"{currency_symbol}{amount:,.2f}"

        return NotificationService.create_notification(
            investor_id=investor_id,
            title="Interest Paid",
            message=f"Weekly interest of {formatted_amount} has been added to your investment balance.",
            notification_type="info",
            event_type="interest_paid",
            metadata={'amount': amount, 'currency': currency, 'period': 'weekly'}
        )

    @staticmethod
    def generate_due_date_reminder_notification(investor_id: str, amount_due: float, days_until_due: int, currency: str = 'NGN') -> dict:
        """Generate notification for upcoming due date."""
        currency_symbol = 'N' if currency == 'NGN' else currency
        formatted_amount = f"{currency_symbol}{amount_due:,.2f}"

        notification_type = "warning" if days_until_due <= 3 else "info"

        return NotificationService.create_notification(
            investor_id=investor_id,
            title=f"Payment Due in {days_until_due} Days",
            message=f"You have {formatted_amount} due for payment in {days_until_due} days. Please ensure sufficient balance.",
            notification_type=notification_type,
            event_type="due_date_reminder",
            metadata={'amount_due': amount_due, 'days_until_due': days_until_due, 'currency': currency}
        )

    @staticmethod
    def generate_investment_ended_notification(investor_id: str, returned_amount: float, currency: str = 'NGN') -> dict:
        """Generate notification for investment ending with amount sent to spending account."""
        currency_symbol = 'N' if currency == 'NGN' else currency
        formatted_amount = f"{currency_symbol}{returned_amount:,.0f}"

        return NotificationService.create_notification(
            investor_id=investor_id,
            title="Investment Ended",
            message=f"Your investment has ended and {formatted_amount} has been transferred to your spending account.",
            notification_type="info",
            event_type="investment_ended",
            metadata={'returned_amount': returned_amount, 'currency': currency}
        )

    @staticmethod
    def generate_investment_renewed_notification(investor_id: str) -> dict:
        """Generate notification for investment renewal."""
        return NotificationService.create_notification(
            investor_id=investor_id,
            title="Investment Renewed",
            message="Your investment has been renewed. You can now select a new investment type.",
            notification_type="success",
            event_type="investment_renewed"
        )

    @staticmethod
    def generate_topup_completed_notification(investor_id: str, amount: float, currency: str = 'NGN') -> dict:
        """Generate notification for completed top-up."""
        currency_symbol = 'N' if currency == 'NGN' else currency
        formatted_amount = f"{currency_symbol}{amount:,.0f}"

        return NotificationService.create_notification(
            investor_id=investor_id,
            title="Top-up Completed",
            message=f"Your investment has been topped up with {formatted_amount}. The additional amount will start earning interest from the next payment cycle.",
            notification_type="success",
            event_type="topup_completed",
            metadata={'amount': amount, 'currency': currency, 'note': 'Interest starts next cycle'}
        )

    @staticmethod
    def generate_referral_points_earned_notification(investor_id: str, points: int) -> dict:
        """Generate notification for earned referral points."""
        return NotificationService.create_notification(
            investor_id=investor_id,
            title="Referral Points Earned!",
            message=f"Congratulations! You earned {points} points from a successful referral. Your referral code is working!",
            notification_type="success",
            event_type="referral_points_earned",
            metadata={'points': points}
        )

    @staticmethod
    def generate_points_redeemed_notification(investor_id: str, points: int, amount: float, currency: str = 'NGN') -> dict:
        """Generate notification for successful points redemption."""
        currency_symbol = 'N' if currency == 'NGN' else currency
        formatted_amount = f"{currency_symbol}{amount:,.0f}"

        return NotificationService.create_notification(
            investor_id=investor_id,
            title="Points Redeemed Successfully",
            message=f"You redeemed {points} points for {formatted_amount}, which has been added to your spending account.",
            notification_type="success",
            event_type="points_redeemed",
            metadata={'points': points, 'amount': amount, 'currency': currency}
        )

    @staticmethod
    def generate_referral_code_used_notification(investor_id: str, referee_name: str) -> dict:
        """Generate notification when someone's referral code is used."""
        return NotificationService.create_notification(
            investor_id=investor_id,
            title="Referral Code Used!",
            message=f"Great news! {referee_name} used your referral code to sign up.",
            notification_type="info",
            event_type="referral_code_used",
            metadata={'referee_name': referee_name}
        )

    @staticmethod
    def generate_account_updated_notification(investor_id: str, message: str) -> dict:
        """Generate notification for account updates like password changes."""
        return NotificationService.create_notification(
            investor_id=investor_id,
            title="Account Updated",
            message=message,
            notification_type="info",
            event_type="account_updated",
            metadata={}
        )

    @staticmethod
    def generate_due_date_reminder_4_days_notification(investor_id: str, next_due_date: str, amount_due: float, currency: str = 'NGN') -> dict:
        """Generate 4-day reminder notification before due date."""
        currency_symbol = 'N' if currency == 'NGN' else currency
        formatted_amount = f"{currency_symbol}{amount_due:,.2f}"

        # Parse next due date to calculate days remaining
        try:
            from datetime import datetime, date
            if isinstance(next_due_date, str):
                due_date = datetime.fromisoformat(next_due_date.replace('Z', '+00:00')).date()
            else:
                due_date = next_due_date

            today = date.today()
            days_remaining = (due_date - today).days
        except:
            days_remaining = 4

        return NotificationService.create_notification(
            investor_id=investor_id,
            title=f"Payment Due in {days_remaining} Days",
            message=f"Your next interest payment of {formatted_amount} is due in {days_remaining} days. Please ensure sufficient balance in your spending account.",
            notification_type="warning",
            event_type="due_date_reminder",
            metadata={'next_due_date': next_due_date, 'amount_due': amount_due, 'days_remaining': days_remaining, 'currency': currency}
        )

    @staticmethod
    def generate_payment_day_notification(investor_id: str, amount_received: float, total_balance: float, currency: str = 'NGN') -> dict:
        """Generate notification on the day of interest payment."""
        currency_symbol = 'N' if currency == 'NGN' else currency
        formatted_amount = f"{currency_symbol}{amount_received:,.2f}"
        formatted_balance = f"{currency_symbol}{total_balance:,.2f}"

        return NotificationService.create_notification(
            investor_id=investor_id,
            title="Interest Payment Received",
            message=f"Congratulations! {formatted_amount} has been added to your spending account. Your new balance is {formatted_balance}.",
            notification_type="success",
            event_type="payment_day_notification",
            metadata={'amount_received': amount_received, 'total_balance': total_balance, 'currency': currency}
        )
