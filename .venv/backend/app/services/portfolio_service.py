"""
Portfolio service for managing investment portfolio logic.
Handles portfolio validation, investment options, and interest calculations.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from ..core.config import settings
from .notification_service import NotificationService

try:
    from supabase import create_client
except Exception:
    create_client = None


class PortfolioService:
    """Service for managing investment portfolio logic."""

    def __init__(self):
        if create_client is None:
            raise RuntimeError("supabase package not installed")

        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise RuntimeError("Supabase config missing in settings")

        self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    # Portfolio configuration constants
    PORTFOLIO_RULES = {
        "Conservative": {
            "Gold Starter": {
                "minimum_balance": 100000,
                "expiry_weeks": 20,
                "weekly_interest_rate": 5.0  # percentage
            },
            "Gold Flair": {
                "minimum_balance": 250000,
                "expiry_weeks": 20,
                "weekly_interest_rate": 5.0
            },
            # Gold Accent and Gold Luxury are not available for Conservative portfolio
        },
        "Balanced": {
            "Gold Starter": {
                "minimum_balance": 2500000,
                "expiry_weeks": 12,
                "weekly_interest_rate": 7.0
            },
            "Gold Flair": {
                "minimum_balance": 5000000,
                "expiry_weeks": 12,
                "weekly_interest_rate": 7.0
            },
            "Gold Accent": {
                "minimum_balance": 7500000,
                "expiry_weeks": 12,
                "weekly_interest_rate": 7.0
            },
            # Gold Luxury  is not available for Balanced portfolio
        },
        "Growth": {
            "Gold Starter": {
                "minimum_balance": 10000000,
                "expiry_weeks": 10,
                "weekly_interest_rate": 10.0
            },
            "Gold Flair": {
                "minimum_balance": 12000000,
                "expiry_weeks": 10,
                "weekly_interest_rate": 10.0
            },
            "Gold Accent": {
                "minimum_balance": 15000000,
                "expiry_weeks": 10,
                "weekly_interest_rate": 10.0
            },
            "Gold Luxury": {
                "minimum_balance": 2000000,
                "expiry_weeks": 10,
                "weekly_interest_rate": 10.0
            }
        }
    }

    def get_available_investments(self, portfolio_type: str) -> List[str]:
        """Get list of available investment options for a portfolio type."""
        # Normalize the portfolio type to handle case sensitivity
        normalized_portfolio_type = portfolio_type.strip() if portfolio_type else ""
        
        # Try exact match first
        if normalized_portfolio_type in self.PORTFOLIO_RULES:
            return list(self.PORTFOLIO_RULES[normalized_portfolio_type].keys())
            
        # Try case-insensitive match
        for key in self.PORTFOLIO_RULES.keys():
            if key.lower() == normalized_portfolio_type.lower():
                return list(self.PORTFOLIO_RULES[key].keys())
        
        # Try matching with common portfolio type variations
        # Handle cases where frontend sends "Portfolio" suffix
        portfolio_variations = {
            "Conservative": ["Conservative", "Conservative Portfolio"],
            "Balanced": ["Balanced", "Balanced Portfolio"],
            "Growth": ["Growth", "Growth Portfolio"]
        }
        
        for key, variations in portfolio_variations.items():
            if key in self.PORTFOLIO_RULES:
                for variation in variations:
                    if normalized_portfolio_type.lower() == variation.lower():
                        return list(self.PORTFOLIO_RULES[key].keys())
        
        return []

    def is_investment_available(self, portfolio_type: str, investment_type: str) -> bool:
        """Check if an investment type is available for a portfolio type."""
        # Use the same normalization logic as get_available_investments
        available_investments = self.get_available_investments(portfolio_type)
        return investment_type in available_investments

    def get_investment_requirements(self, portfolio_type: str, investment_type: str) -> Optional[Dict[str, Any]]:
        """Get requirements for a specific investment type in a portfolio."""
        # Normalize the portfolio type to handle case sensitivity and variations
        normalized_portfolio_type = portfolio_type.strip() if portfolio_type else ""
        
        # Try exact match first
        if normalized_portfolio_type in self.PORTFOLIO_RULES:
            if investment_type in self.PORTFOLIO_RULES[normalized_portfolio_type]:
                return self.PORTFOLIO_RULES[normalized_portfolio_type][investment_type]
        
        # Try case-insensitive match
        for key in self.PORTFOLIO_RULES.keys():
            if key.lower() == normalized_portfolio_type.lower():
                if investment_type in self.PORTFOLIO_RULES[key]:
                    return self.PORTFOLIO_RULES[key][investment_type]
        
        # Try matching with common portfolio type variations
        # Handle cases where frontend sends "Portfolio" suffix
        portfolio_variations = {
            "Conservative": ["Conservative", "Conservative Portfolio"],
            "Balanced": ["Balanced", "Balanced Portfolio"],
            "Growth": ["Growth", "Growth Portfolio"]
        }
        
        for key, variations in portfolio_variations.items():
            if key in self.PORTFOLIO_RULES:
                for variation in variations:
                    if normalized_portfolio_type.lower() == variation.lower():
                        if investment_type in self.PORTFOLIO_RULES[key]:
                            return self.PORTFOLIO_RULES[key][investment_type]
        
        return None

    def validate_investment(self, portfolio_type: str, investment_type: str, initial_balance: float) -> Dict[str, Any]:
        """Validate if an investment meets the minimum requirements."""
        requirements = self.get_investment_requirements(portfolio_type, investment_type)
        
        if not requirements:
            return {
                "success": False,
                "error": f"Investment type '{investment_type}' is not available for portfolio '{portfolio_type}'"
            }
        
        if initial_balance < requirements["minimum_balance"]:
            return {
                "success": False,
                "error": f"Minimum balance for {investment_type} in {portfolio_type} portfolio is {requirements['minimum_balance']}",
                "required_balance": requirements["minimum_balance"]
            }
        
        return {
            "success": True,
            "requirements": requirements
        }

    def calculate_weekly_interest(self, portfolio_type: str, investment_type: str, initial_balance: float) -> Optional[float]:
        """Calculate weekly interest amount for an investment."""
        requirements = self.get_investment_requirements(portfolio_type, investment_type)
        
        if not requirements:
            return None
        
        # Calculate weekly interest amount
        weekly_rate = requirements["weekly_interest_rate"] / 100
        weekly_interest = initial_balance * weekly_rate
        return weekly_interest

    def calculate_amount_due(self, portfolio_type: str, investment_type: str, initial_balance: float, weeks_elapsed: int) -> Optional[float]:
        """Calculate total amount due based on weeks elapsed."""
        weekly_interest = self.calculate_weekly_interest(portfolio_type, investment_type, initial_balance)
        
        if weekly_interest is None:
            return None
        
        # Total amount due is weekly interest multiplied by weeks elapsed
        total_due = weekly_interest * weeks_elapsed
        return total_due

    def get_investment_expiry_date(self, portfolio_type: str, investment_type: str, start_date: Optional[datetime] = None) -> Optional[datetime]:
        """Calculate investment expiry date."""
        requirements = self.get_investment_requirements(portfolio_type, investment_type)
        
        if not requirements:
            return None
        
        if start_date is None:
            start_date = datetime.now()
        
        # Add weeks to start date
        expiry_date = start_date + timedelta(weeks=requirements["expiry_weeks"])
        return expiry_date

    def get_portfolio_data(self, investor_id: str) -> Dict[str, Any]:
        """Get portfolio data for an investor including available investments and current status."""
        try:
            # Get investor details
            investor_response = self.supabase.table('investors').select('*').eq('id', investor_id).execute()
            investor_data = getattr(investor_response, 'data', [])
            
            if not investor_data:
                return {
                    'success': False,
                    'error': 'Investor not found'
                }
            
            investor = investor_data[0]
            
            # Ensure due dates are up to date
            try:
                from .interest_calculation_service import InterestCalculationService
                interest_service = InterestCalculationService()
                interest_service.ensure_due_dates_up_to_date(investor_id)
                
                # Refresh investor data after update
                investor_response = self.supabase.table('investors').select('*').eq('id', investor_id).execute()
                investor_data = getattr(investor_response, 'data', [])
                if investor_data:
                    investor = investor_data[0]
            except Exception as e:
                print(f"Error ensuring due dates in portfolio service: {e}")
                # Continue with existing data if update fails

            portfolio_type = investor.get('portfolio_type')
            
            # Normalize portfolio type to match backend expectations
            if portfolio_type:
                if 'Conservative' in portfolio_type:
                    portfolio_type = 'Conservative'
                elif 'Balanced' in portfolio_type:
                    portfolio_type = 'Balanced'
                elif 'Growth' in portfolio_type:
                    portfolio_type = 'Growth'
            
            initial_investment = float(investor.get('initial_investment', 0))
            
            # Get available investments for this portfolio
            available_investments = self.get_available_investments(portfolio_type)
            
            # Validate current investment
            investment_validation = {}
            if investor.get('investment_type'):
                investment_validation = self.validate_investment(
                    portfolio_type, 
                    investor['investment_type'], 
                    initial_investment
                )
            
            # Get transaction history for this investor
            transaction_response = self.supabase.table('transactions').select('*').eq('investor_id', investor_id).execute()
            transactions = getattr(transaction_response, 'data', [])
            
            # Calculate current amount due
            amount_due = 0
            if investor.get('investment_type'):
                # Calculate weeks elapsed since investment start
                created_at = investor.get('created_at')
                if created_at:
                    if isinstance(created_at, str):
                        start_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    else:
                        start_date = created_at
                    
                    weeks_elapsed = (datetime.now(start_date.tzinfo) - start_date).days // 7
                    amount_due = self.calculate_amount_due(
                        portfolio_type, 
                        investor['investment_type'], 
                        initial_investment, 
                        weeks_elapsed
                    ) or 0
            
            return {
                'success': True,
                'portfolio_type': portfolio_type,
                'initial_investment': initial_investment,
                'investment_type': investor.get('investment_type'),
                'available_investments': available_investments,
                'investment_validation': investment_validation,
                'amount_due': amount_due,
                'transactions': transactions,
                'last_due_date': investor.get('last_due_date'),
                'next_due_date': investor.get('next_due_date'),
                'investment_start_date': investor.get('investment_start_date'),
                'investment_expiry_date': investor.get('investment_expiry_date'),
                'current_week': investor.get('current_week')
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Error retrieving portfolio data: {str(e)}'
            }

    def update_investment_type(self, investor_id: str, investment_type: str) -> Dict[str, Any]:
        """Update the investment type for an investor."""
        try:
            # Get investor details
            investor_response = self.supabase.table('investors').select('portfolio_type, initial_investment').eq('id', investor_id).execute()
            investor_data = getattr(investor_response, 'data', [])

            if not investor_data:
                return {
                    'success': False,
                    'error': 'Investor not found'
                }

            investor = investor_data[0]
            portfolio_type = investor.get('portfolio_type')
            initial_investment = float(investor.get('initial_investment', 0))

            # Validate investment
            validation = self.validate_investment(portfolio_type, investment_type, initial_investment)

            if not validation['success']:
                return validation

            # Get investment requirements to calculate expiry
            requirements = self.get_investment_requirements(portfolio_type, investment_type)
            if not requirements:
                return {
                    'success': False,
                    'error': 'Unable to retrieve investment requirements'
                }

            # Calculate due dates (Week 0 logic - investment selection day)
            investment_start_date = datetime.now()
            last_due_date = investment_start_date  # Last due date starts as selection day
            next_due_date = investment_start_date + timedelta(days=7)  # Next due date = 7 days from selection

            # Calculate expiry date
            expiry_weeks = requirements.get('expiry_weeks', 8)  # Default to 8 weeks if not specified
            investment_expiry_date = investment_start_date + timedelta(weeks=expiry_weeks)

            # Update investment type with due dates and expiry tracking
            update_response = self.supabase.table('investors').update({
                'investment_type': investment_type,
                'investment_start_date': investment_start_date.isoformat(),
                'last_due_date': last_due_date.isoformat(),
                'next_due_date': next_due_date.isoformat(),
                'investment_expiry_date': investment_expiry_date.isoformat(),
                'current_week': 0,  # Start at week 0
                'updated_at': datetime.now().isoformat()
            }).eq('id', investor_id).execute()
            
            # Handle the response properly - Supabase update returns the updated record
            success = False
            
            # Check different response formats
            try:
                # If response has data attribute and it's not a string
                if not isinstance(update_response, str) and hasattr(update_response, 'data'):
                    data = getattr(update_response, 'data', None)
                    if data is not None:
                        success = True
                # If response is a dict
                elif isinstance(update_response, dict):
                    if update_response.get('data') is not None:
                        success = True
                # If response is a list (successful update returns list of updated records)
                elif isinstance(update_response, list):
                    success = True
                # For any other response that's not None or empty, assume success
                elif update_response is not None:
                    # Check if it's not an error string
                    if isinstance(update_response, str) and "error" not in update_response.lower():
                        success = True
                    elif not isinstance(update_response, str):
                        success = True
            except Exception as e:
                print(f"Error processing Supabase response: {e}")
                success = False
            
            if success:
                # If update was successful, also update transactions table
                try:
                    # Import transaction service
                    from .transaction_service import TransactionService
                    transaction_service = TransactionService()
                    
                    # Update transactions with new investment type and calculated amounts
                    print(f"DEBUG: Calling update_transaction_amounts for investor {investor_id} with investment type {investment_type}")
                    transaction_update_result = transaction_service.update_transaction_amounts(investor_id, investment_type)
                    print(f"DEBUG: Transaction update result: {transaction_update_result}")
                    
                    if not transaction_update_result['success']:
                        # Log the error but don't fail the entire operation
                        print(f"Warning: Failed to update transactions: {transaction_update_result['error']}")
                    else:
                        print(f"DEBUG: Successfully updated transactions: {transaction_update_result}")
                except Exception as e:
                    # Log the error but don't fail the entire operation
                    print(f"Warning: Error updating transactions: {str(e)}")
                    import traceback
                    traceback.print_exc()
                
                # If update was successful
                result = {
                    'success': True,
                    'message': f'Investment type updated to {investment_type}',
                    'investment_type': investment_type,
                    'requirements': validation.get('requirements')
                }

                # Generate investment selection notification
                result['notification'] = NotificationService.generate_investment_selected_notification(
                    investor_id=investor_id,
                    investment_type=investment_type,
                    portfolio_type=portfolio_type
                )

                return result
            else:
                return {
                    'success': False,
                    'error': 'Failed to update investment type - Update operation failed'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Error updating investment type: {str(e)}'
            }
