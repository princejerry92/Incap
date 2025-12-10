"""
Script to clean up expired notifications from the database.
This should be run periodically (e.g., daily) as a scheduled task.
"""
import os
import sys
from app.services.notification_persistence_service import NotificationPersistenceService

def cleanup_expired_notifications():
    """Clean up expired notifications."""
    try:
        print("Cleaning up expired notifications...")
        
        # Create notification persistence service
        service = NotificationPersistenceService()
        
        # Clean up expired notifications
        result = service.cleanup_expired_notifications()
        
        if result['success']:
            print(f"✅ {result['message']}")
            return True
        else:
            print(f"❌ Failed to clean up expired notifications: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Error during cleanup: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = cleanup_expired_notifications()
    if success:
        print("Cleanup completed successfully!")
        sys.exit(0)
    else:
        print("Cleanup failed!")
        sys.exit(1)