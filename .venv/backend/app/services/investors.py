# investors.py (services)
# ----------------------
# This module contains the business logic for investor operations:
# - Validates incoming data
# - Generates unique account numbers
# - Hashes PINs
# - Inserts records into Supabase
#
# It is imported by routes/investors.py, which exposes API endpoints.
from typing import Optional, Dict, Any
from datetime import date
import re

from ..core.config import settings
from .transaction_service import TransactionService
from .notification_service import NotificationService

try:
    from supabase import create_client
except Exception:  # pragma: no cover - dev only
    create_client = None

try:
    from passlib.context import CryptContext
except ImportError:
    CryptContext = None
    raise RuntimeError("passlib is not installed. Please install 'passlib' to use InvestorService.")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class InvestorService:
    """Service for validating and inserting investor records into Supabase.

    Usage:
      svc = InvestorService()
      data = { ... }  # fields from OpenAccountWizard
      svc.create_investor(data)
    """

    def __init__(self):
        self.supabase = None
        if create_client is None:
            raise RuntimeError("supabase package not installed. Install 'supabase' to use InvestorService")

        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise RuntimeError("Supabase config missing in settings")

        self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    def _validate_email(self, email: str) -> bool:
        return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))

    def _validate_phone(self, phone: str) -> bool:
        return bool(re.match(r"^[0-9+\-\s()]{7,30}$", phone))

    def _generate_account_number(self) -> str:
        # Simple INV-prefixed unique account number. Ensure DB uniqueness on insert.
        import random
        return f"INV{random.randint(10**7, 10**9)}"

    def _hash_pin(self, pin: str) -> str:
        # Ensure pin is a string and truncate to 72 bytes to comply with bcrypt limit
        if not isinstance(pin, str):
            pin = str(pin)
        pin_bytes = pin.encode('utf-8')
        if len(pin_bytes) > 72:
            pin = pin_bytes[:72].decode('utf-8', errors='ignore')
        return pwd_context.hash(pin)

    REQUIRED_FIELDS = [
        'name', 'surname', 'email', 'phone', 'address', 'dob',
        'identityType', 'identityNumber', 'bankName', 'accountName', 'accountNumber',
        'amount', 'selectedInvestment', 'pin'
    ]

    def _prepare_record(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        # Map and coerce fields expected by the DB. Note: server generates the
        # internal account_number (INV...) — do not trust frontend-generated values.
        
        # Normalize portfolio type to match backend expectations
        portfolio_type = payload.get('selectedInvestment') or payload.get('portfolio_type')
        if portfolio_type:
            if 'Conservative' in portfolio_type:
                portfolio_type = 'Conservative'
            elif 'Balanced' in portfolio_type:
                portfolio_type = 'Balanced'
            elif 'Growth' in portfolio_type:
                portfolio_type = 'Growth'
        
        rec = {
            'first_name': payload.get('name') or payload.get('first_name'),
            'surname': payload.get('surname'),
            'email': payload.get('email'),
            'phone': payload.get('phone'),
            'address': payload.get('address'),
            'date_of_birth': payload.get('dob') or payload.get('date_of_birth'),
            'identity_type': payload.get('identityType') or payload.get('identity_type'),
            'identity_number': payload.get('identityNumber') or payload.get('identity_number'),
            'bank_name': payload.get('bankName') or payload.get('bank_name'),
            'bank_account_name': payload.get('accountName') or payload.get('bank_account_name'),
            # bank_account_number is the user's real bank account; frontend should provide it
            'bank_account_number': payload.get('accountNumber') or payload.get('bank_account_number'),
            'initial_investment': float(payload.get('amount') or payload.get('initial_investment') or 0),
            'total_investment': float(payload.get('amount') or payload.get('initial_investment') or 0),
            'portfolio_type': portfolio_type,
            'investment_type': payload.get('investmentType') or payload.get('investment_type'),  # Added investment type
            'paystack_reference': payload.get('paystack_reference', ''),  # New field for Paystack reference
            'payment_status': payload.get('payment_status', 'pending'),  # New field for payment status
        }

        # PIN is hashed here; account_number is generated server-side in create_investor
        pin = payload.get('pin')
        rec['pin_hash'] = self._hash_pin(pin) if pin else None

        return rec

    def _validate_payload(self, payload: Dict[str, Any]) -> Optional[str]:
        # Return None if valid, otherwise an error message
        if not payload.get('email') or not self._validate_email(payload['email']):
            return "Invalid email"

        phone = payload.get('phone')
        if phone and not self._validate_phone(phone):
            return "Invalid phone number"

        if payload.get('pin') and (not payload['pin'].isdigit() or len(payload['pin']) != 4):
            return "PIN must be a 4-digit numeric string"

        if not payload.get('selectedInvestment') and not payload.get('portfolio_type'):
            return "Portfolio type is required"

        try:
            amt = float(payload.get('amount') or payload.get('initial_investment') or 0)
            if amt <= 0:
                return "Initial investment must be greater than 0"
            
            # Ensure we can set both fields properly
            if not payload.get('amount') and not payload.get('initial_investment'):
                return "Initial investment amount is required but missing from payload"
        except Exception:
            return "Invalid initial investment amount"

        return None

    def create_investor(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and insert an investor row into Supabase.

        Returns a dict with keys: success(bool), data(record if success), error(str if not)
        """
        err = self._validate_payload(payload)
        if err:
            return {'success': False, 'error': err}

        base_rec = self._prepare_record(payload)

        # Set investment_start_date if investment_type is provided
        if payload.get('investment_type') and not base_rec.get('investment_start_date'):
            from datetime import datetime
            base_rec['investment_start_date'] = datetime.now().isoformat()

        # Initialize due dates if investment_type is provided
        if payload.get('investment_type'):
            from datetime import date, timedelta
            today = date.today()
            # Set next_due_date to 7 days from now for weekly payments
            base_rec['next_due_date'] = (today + timedelta(days=7)).isoformat()
            # last_due_date is None initially
            base_rec['last_due_date'] = None

        max_attempts = 5
        last_error = None
        for attempt in range(max_attempts):
            # Always generate the server-side account number to avoid frontend-provided INV values
            base_rec['account_number'] = self._generate_account_number()

            # Check if supabase client is initialized
            if self.supabase is None:
                return {'success': False, 'error': 'Supabase client not initialized'}

            try:
                resp = self.supabase.table('investors').insert(base_rec).execute()
            except Exception as e:
                msg = str(e)
                last_error = msg
                # If the error indicates a duplicate account_number, retry
                low = msg.lower()
                if 'account_number' in low or 'duplicate' in low or 'unique' in low:
                    # retry (generate new account number)
                    continue
                # If email conflict, return an explicit error
                if 'email' in low:
                    return {'success': False, 'error': 'Email already exists'}
                return {'success': False, 'error': f'Supabase insert error: {msg}'}

            # Handle client response variants
            data = None
            error = None
            if isinstance(resp, dict):
                data = resp.get('data')
                error = resp.get('error')
            else:
                data = getattr(resp, 'data', None)
                error = getattr(resp, 'error', None)

            if error:
                msg = str(error)
                last_error = msg
                low = msg.lower()
                # detect account_number uniqueness conflict and retry
                if 'account_number' in low or 'duplicate' in low or 'unique' in low:
                    continue
                if 'email' in low:
                    return {'success': False, 'error': 'Email already exists'}
                return {'success': False, 'error': msg}

            # Success path: data may be a list
            if isinstance(data, list) and data:
                investor_record = data[0]
                # Record the initial transaction
                transaction_service = TransactionService()
                transaction_result = transaction_service.record_initial_transaction(investor_record)
                if not transaction_result['success']:
                    # Log the error but don't fail the investor creation
                    print(f"Warning: Failed to record initial transaction: {transaction_result['error']}")

                result = {'success': True, 'data': investor_record}
                # Generate account creation notification
                result['notification'] = NotificationService.generate_account_created_notification(
                    investor_id=investor_record['id'],
                    email=investor_record['email']
                )
                return result
            elif data is not None:
                investor_record = data
                # Record the initial transaction
                transaction_service = TransactionService()
                transaction_result = transaction_service.record_initial_transaction(investor_record)
                if not transaction_result['success']:
                    # Log the error but don't fail the investor creation
                    print(f"Warning: Failed to record initial transaction: {transaction_result['error']}")

                result = {'success': True, 'data': investor_record}
                # Generate account creation notification
                result['notification'] = NotificationService.generate_account_created_notification(
                    investor_id=investor_record['id'],
                    email=investor_record['email']
                )
                return result

        return {'success': False, 'error': f'Failed to insert after {max_attempts} attempts: {last_error}'}

    def update_investment_type(self, investor_id: str, investment_type: str) -> Dict[str, Any]:
        """Update investment type and initialize due dates for an existing investor.

        Args:
            investor_id: The investor ID to update
            investment_type: The new investment type

        Returns:
            Dict with success status and data/error
        """
        try:
            if self.supabase is None:
                return {'success': False, 'error': 'Supabase client not initialized'}

            from datetime import date, timedelta, datetime

            # Get current investor data
            investor_resp = self.supabase.table('investors').select('*').eq('id', investor_id).execute()
            data = None
            error = None
            if isinstance(investor_resp, dict):
                data = investor_resp.get('data')
                error = investor_resp.get('error')
            else:
                data = getattr(investor_resp, 'data', None)
                error = getattr(investor_resp, 'error', None)

            if not data or len(data) == 0:
                return {'success': False, 'error': f'Investor not found: {error}'}

            investor = data[0]

            # Prepare update data
            update_data = {
                'investment_type': investment_type,
                'updated_at': datetime.now().isoformat()
            }

            # Set investment_start_date if not already set
            if not investor.get('investment_start_date'):
                update_data['investment_start_date'] = datetime.now().isoformat()

            # Initialize due dates
            today = date.today()
            update_data['next_due_date'] = (today + timedelta(days=7)).isoformat()
            update_data['last_due_date'] = None

            # Update the investor record
            update_resp = self.supabase.table('investors').update(update_data).eq('id', investor_id).execute()

            update_data_result = None
            update_error = None
            if isinstance(update_resp, dict):
                update_data_result = update_resp.get('data')
                update_error = update_resp.get('error')
            else:
                update_data_result = getattr(update_resp, 'data', None)
                update_error = getattr(update_resp, 'error', None)

            if update_error:
                return {'success': False, 'error': f'Failed to update investor: {update_error}'}

            return {'success': True, 'data': update_data_result[0] if isinstance(update_data_result, list) and update_data_result else update_data_result}

        except Exception as e:
            return {'success': False, 'error': f'Error updating investment type: {str(e)}'}
