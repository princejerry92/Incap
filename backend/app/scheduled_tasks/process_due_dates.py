"""
Scheduled task to process auto-withdrawals for investors with due dates today.
This script should be run daily via cron job or similar scheduling mechanism.
"""
import sys
import os

# Add the parent directory to the Python path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ..services.interest_calculation_service import InterestCalculationService
from ..services.notification_persistence_service import NotificationPersistenceService

def process_due_dates():
    """Process auto-withdrawals for all investors with due dates today."""
    try:
        print("Starting due date processing...")
        
        interest_service = InterestCalculationService()
        result = interest_service.check_and_process_all_due_dates()
        
        if result['success']:
            print(f"Successfully processed {result['processed_count']} auto-withdrawals")
            if result['errors']:
                print("Errors encountered:")
                for error in result['errors']:
                    print(f"  - {error}")
        else:
            print(f"Error processing due dates: {result['error']}")
            
    except Exception as e:
        print(f"Unexpected error in due date processing: {str(e)}")
        import traceback
        traceback.print_exc()

def cleanup_expired_notifications():
    """Clean up expired notifications."""
    try:
        print("Cleaning up expired notifications...")
        
        notification_service = NotificationPersistenceService()
        result = notification_service.cleanup_expired_notifications()
        
        if result['success']:
            print(f"Successfully {result['message']}")
        else:
            print(f"Error cleaning up expired notifications: {result['error']}")
            
    except Exception as e:
        print(f"Unexpected error in notification cleanup: {str(e)}")
        import traceback
        traceback.print_exc()

def run_scheduled_tasks():
    """Run all scheduled tasks."""
    print("Running scheduled tasks...")
    
    # Process due dates
    process_due_dates()
    
    # Clean up expired notifications
    cleanup_expired_notifications()
    
    print("Scheduled tasks completed.")

if __name__ == "__main__":
    run_scheduled_tasks()