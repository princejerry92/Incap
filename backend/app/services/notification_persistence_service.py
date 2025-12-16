"""
Notification persistence service for storing and managing notifications in the database.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import uuid
from ..core.config import settings

try:
    from supabase import create_client
except Exception:
    create_client = None


class NotificationPersistenceService:
    """Service for persisting notifications in the database."""
    
    def __init__(self):
        if create_client is None:
            raise RuntimeError("supabase package not installed")
            
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise RuntimeError("Supabase config missing in settings")
            
        self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    
    def create_notification(self, investor_id: str, title: str, message: str, 
                          notification_type: str, event_type: str, 
                          metadata: Optional[Dict[Any, Any]] = None) -> Dict[str, Any]:
        """
        Create and store a notification in the database.
        
        Args:
            investor_id: The investor ID the notification belongs to
            title: Short notification title
            message: Longer descriptive message
            notification_type: 'success', 'warning', 'error', 'info'
            event_type: Specific event identifier
            metadata: Optional additional data for the event
            
        Returns:
            Dict containing the created notification data
        """
        try:
            now = datetime.utcnow()
            notification_id = f"{event_type}_{uuid.uuid4().hex[:8]}_{int(now.timestamp())}"
            
            notification_data = {
                'id': notification_id,
                'investor_id': investor_id,
                'title': title,
                'message': message,
                'type': notification_type,
                'event_type': event_type,
                'timestamp': now.isoformat(),
                'expires_at': (now + timedelta(days=30)).isoformat(),
                'read': False
            }
            
            if metadata:
                notification_data['metadata'] = metadata
            
            # Insert into database
            response = self.supabase.table('notifications').insert(notification_data).execute()
            data = getattr(response, 'data', [])
            
            if data:
                return {
                    'success': True,
                    'data': data[0]
                }
            else:
                return {
                    'success': False,
                    'error': 'Failed to create notification'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Error creating notification: {str(e)}'
            }
    
    def get_notifications(self, investor_id: str, limit: int = 50, 
                         since: Optional[str] = None) -> Dict[str, Any]:
        """
        Get notifications for an investor.
        
        Args:
            investor_id: The investor ID
            limit: Maximum number of notifications to return
            since: ISO timestamp to filter notifications after this time
            
        Returns:
            Dict containing notifications list
        """
        try:
            query = self.supabase.table('notifications').select('*').eq('investor_id', investor_id)
            
            if since:
                query = query.gte('timestamp', since)
            
            response = query.order('timestamp', desc=True).limit(limit).execute()
            data = getattr(response, 'data', [])
            
            return {
                'success': True,
                'data': data
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Error fetching notifications: {str(e)}'
            }
    
    def mark_as_read(self, investor_id: str, notification_id: str) -> Dict[str, Any]:
        """
        Mark a notification as read.
        
        Args:
            investor_id: The investor ID
            notification_id: The notification ID to mark as read
            
        Returns:
            Dict containing success status
        """
        try:
            update_data = {
                'read': True,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            response = self.supabase.table('notifications').update(update_data)\
                .eq('id', notification_id).eq('investor_id', investor_id).execute()
            
            if getattr(response, 'data', []):
                return {
                    'success': True,
                    'message': 'Notification marked as read'
                }
            else:
                return {
                    'success': False,
                    'error': 'Notification not found or not updated'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Error marking notification as read: {str(e)}'
            }
    
    def mark_all_as_read(self, investor_id: str) -> Dict[str, Any]:
        """
        Mark all notifications as read for an investor.
        
        Args:
            investor_id: The investor ID
            
        Returns:
            Dict containing success status
        """
        try:
            update_data = {
                'read': True,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            response = self.supabase.table('notifications').update(update_data)\
                .eq('investor_id', investor_id).eq('read', False).execute()
            
            return {
                'success': True,
                'message': f'Marked {len(getattr(response, "data", []))} notifications as read'
            }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Error marking all notifications as read: {str(e)}'
            }
    
    def delete_notification(self, investor_id: str, notification_id: str) -> Dict[str, Any]:
        """
        Delete a notification.
        
        Args:
            investor_id: The investor ID
            notification_id: The notification ID to delete
            
        Returns:
            Dict containing success status
        """
        try:
            response = self.supabase.table('notifications').delete()\
                .eq('id', notification_id).eq('investor_id', investor_id).execute()
            
            if getattr(response, 'data', []):
                return {
                    'success': True,
                    'message': 'Notification deleted'
                }
            else:
                return {
                    'success': False,
                    'error': 'Notification not found or not deleted'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Error deleting notification: {str(e)}'
            }
    
    def clear_all_notifications(self, investor_id: str) -> Dict[str, Any]:
        """
        Clear all notifications for an investor.
        
        Args:
            investor_id: The investor ID
            
        Returns:
            Dict containing success status
        """
        try:
            response = self.supabase.table('notifications').delete()\
                .eq('investor_id', investor_id).execute()
            
            return {
                'success': True,
                'message': f'Deleted {len(getattr(response, "data", []))} notifications'
            }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Error clearing notifications: {str(e)}'
            }
    
    def cleanup_expired_notifications(self) -> Dict[str, Any]:
        """
        Clean up expired notifications from the database.
        
        Returns:
            Dict containing cleanup results
        """
        try:
            now = datetime.utcnow().isoformat()
            response = self.supabase.table('notifications').delete()\
                .lt('expires_at', now).execute()
            
            deleted_count = len(getattr(response, 'data', []))
            
            return {
                'success': True,
                'message': f'Deleted {deleted_count} expired notifications'
            }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Error cleaning up expired notifications: {str(e)}'
            }
