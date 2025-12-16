"""
Server Events Service for managing dashboard cards/promo content.
Handles caching, updates, and real-time flag management.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

try:
    from supabase import create_client
except Exception:
    create_client = None


class ServerEventsService:
    """Service for managing server-sent events and dashboard cards."""

    def __init__(self):
        if create_client is None:
            raise RuntimeError("supabase package not installed")

        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise RuntimeError("Supabase config missing in settings")

        self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    def get_active_events(self, limit: int = 10) -> Dict[str, Any]:
        """Get active server events for dashboard display."""
        try:
            response = self.supabase.table('server_events')\
                .select('*')\
                .eq('is_active', True)\
                .order('updated_at', desc=True)\
                .order('created_at', desc=True)\
                .limit(limit)\
                .execute()

            events = getattr(response, 'data', [])

            return {
                'success': True,
                'events': events,
                'count': len(events)
            }
        except Exception as e:
            logger.error(f"Error fetching active events: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to fetch events: {str(e)}",
                'events': [],
                'count': 0
            }

    def create_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new server event."""
        try:
            # Validate required fields
            required_fields = ['event_type', 'title']
            if not all(field in event_data for field in required_fields):
                return {
                    'success': False,
                    'error': f"Missing required fields: {required_fields}"
                }

            # Validate event_type
            valid_types = ['text', 'picture', 'notification']
            if event_data['event_type'] not in valid_types:
                return {
                    'success': False,
                    'error': f"Invalid event_type. Must be one of: {valid_types}"
                }

            # Prepare data
            insert_data = {
                'event_type': event_data['event_type'],
                'title': event_data['title'],
                'content': event_data.get('content', ''),
                'image_url': event_data.get('image_url', ''),
                'is_active': event_data.get('is_active', True)
            }

            response = self.supabase.table('server_events')\
                .insert(insert_data)\
                .execute()

            created_event = getattr(response, 'data', [])
            if created_event:
                # Trigger update flag update after creation
                self._set_events_update_flag()

                return {
                    'success': True,
                    'event': created_event[0],
                    'message': 'Event created successfully'
                }
            else:
                return {
                    'success': False,
                    'error': 'Failed to create event, no data returned'
                }

        except Exception as e:
            logger.error(f"Error creating event: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to create event: {str(e)}"
            }

    def update_event(self, event_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing server event."""
        try:
            # Prepare update data
            allowed_fields = ['event_type', 'title', 'content', 'image_url', 'is_active']
            update_dict = {}

            for field in allowed_fields:
                if field in update_data:
                    update_dict[field] = update_data[field]

            if not update_dict:
                return {
                    'success': False,
                    'error': 'No valid fields to update'
                }

            # Validate event_type if being updated
            if 'event_type' in update_dict:
                valid_types = ['text', 'picture', 'notification']
                if update_dict['event_type'] not in valid_types:
                    return {
                        'success': False,
                        'error': f"Invalid event_type. Must be one of: {valid_types}"
                    }

            response = self.supabase.table('server_events')\
                .update(update_dict)\
                .eq('id', event_id)\
                .execute()

            updated_event = getattr(response, 'data', [])
            if updated_event:
                # Trigger update flag update
                self._set_events_update_flag()

                return {
                    'success': True,
                    'event': updated_event[0],
                    'message': 'Event updated successfully'
                }
            else:
                return {
                    'success': False,
                    'error': 'Event not found or no changes made'
                }

        except Exception as e:
            logger.error(f"Error updating event {event_id}: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to update event: {str(e)}"
            }

    def delete_event(self, event_id: str) -> Dict[str, Any]:
        """Delete a server event (soft delete by setting inactive)."""
        try:
            # Check if event exists first
            exists_response = self.supabase.table('server_events')\
                .select('id')\
                .eq('id', event_id)\
                .execute()

            if not getattr(exists_response, 'data', []):
                return {
                    'success': False,
                    'error': 'Event not found'
                }

            # Soft delete by setting inactive
            response = self.supabase.table('server_events')\
                .update({'is_active': False})\
                .eq('id', event_id)\
                .execute()

            if getattr(response, 'data', []):
                # Trigger update flag
                self._set_events_update_flag()

                return {
                    'success': True,
                    'message': 'Event deleted successfully'
                }
            else:
                return {
                    'success': False,
                    'error': 'Failed to delete event'
                }

        except Exception as e:
            logger.error(f"Error deleting event {event_id}: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to delete event: {str(e)}"
            }

    def get_events_for_admin(self, include_inactive: bool = True) -> Dict[str, Any]:
        """Get all events for admin management."""
        try:
            query = self.supabase.table('server_events')\
                .select('*')\
                .order('updated_at', desc=True)\
                .order('created_at', desc=True)

            if not include_inactive:
                query = query.eq('is_active', True)

            response = query.execute()
            events = getattr(response, 'data', [])

            return {
                'success': True,
                'events': events,
                'count': len(events)
            }
        except Exception as e:
            logger.error(f"Error fetching events for admin: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to fetch events: {str(e)}",
                'events': [],
                'count': 0
            }

    def get_events_update_flag(self) -> bool:
        """Check if there are pending event updates."""
        try:
            # Check system_settings table
            response = self.supabase.table('system_settings')\
                .select('value')\
                .eq('key', 'events_update_flag')\
                .execute()

            data = getattr(response, 'data', [])
            if data:
                return data[0]['value'] == 'true'
            return False
        except Exception as e:
            logger.error(f"Error checking events update flag: {str(e)}")
            return False

    def _set_events_update_flag(self, flag: bool = True) -> None:
        """Set the events update flag to trigger client refresh."""
        try:
            # Update or insert flag
            flag_value = 'true' if flag else 'false'

            # Update upsert in system_settings
            self.supabase.table('system_settings')\
                .upsert({
                    'key': 'events_update_flag',
                    'value': flag_value,
                    'updated_at': datetime.now().isoformat()
                })\
                .execute()

        except Exception as e:
            logger.error(f"Error setting events update flag: {str(e)}")

    def clear_events_update_flag(self) -> None:
        """Clear the events update flag after client has refreshed."""
        self._set_events_update_flag(False)
