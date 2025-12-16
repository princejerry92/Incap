"""
Notification API routes for managing user notifications.
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from pydantic import BaseModel
from typing import Dict,Any
from ..services.dashboard import DashboardService
from ..services.notification_persistence_service import NotificationPersistenceService

class CreateNotificationRequest(BaseModel):
    title: str
    message: str
    type: str
    event_type: str
    investor_id: Optional[str] = None
    timestamp: Optional[str] = None
    metadata: Optional[Dict[Any, Any]] = None

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class MarkReadRequest(BaseModel):
    notification_id: str

@router.get("/")
async def get_notifications(
    limit: int = 50,
    since: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    """Get user notifications."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    # Extract token from "Bearer <token>" format
    session_token = authorization
    if authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")

    try:
        # Get user from session
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)

        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")

        # Get investor ID from user email (notifications reference investors table)
        investor_response = dashboard_service.supabase.table('investors').select('id').eq('email', user['email']).execute()
        investor_data = getattr(investor_response, 'data', [])

        if not investor_data:
            raise HTTPException(status_code=404, detail="Investor not found")

        investor_id = investor_data[0]['id']

        # Get notifications
        notification_service = NotificationPersistenceService()
        result = notification_service.get_notifications(investor_id, limit, since)

        if result['success']:
            return result
        else:
            raise HTTPException(status_code=500, detail=result.get('error', 'Unknown error'))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching notifications: {str(e)}")

@router.post("/mark-read")
async def mark_notification_as_read(
    request: MarkReadRequest,
    authorization: Optional[str] = Header(None)
):
    """Mark a notification as read."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    session_token = authorization
    if authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")

    try:
        # Get user from session
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)

        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")

        # Get investor ID from user email (notifications reference investors table)
        investor_response = dashboard_service.supabase.table('investors').select('id').eq('email', user['email']).execute()
        investor_data = getattr(investor_response, 'data', [])

        if not investor_data:
            raise HTTPException(status_code=404, detail="Investor not found")

        investor_id = investor_data[0]['id']

        # Mark notification as read
        notification_service = NotificationPersistenceService()
        result = notification_service.mark_as_read(investor_id, request.notification_id)

        if result['success']:
            return result
        else:
            raise HTTPException(status_code=500, detail=result.get('error', 'Unknown error'))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking notification as read: {str(e)}")

@router.post("/mark-all-read")
async def mark_all_notifications_as_read(authorization: Optional[str] = Header(None)):
    """Mark all notifications as read."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    session_token = authorization
    if authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")

    try:
        # Get user from session
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)

        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")

        # Get investor ID from user email (notifications reference investors table)
        investor_response = dashboard_service.supabase.table('investors').select('id').eq('email', user['email']).execute()
        investor_data = getattr(investor_response, 'data', [])

        if not investor_data:
            raise HTTPException(status_code=404, detail="Investor not found")

        investor_id = investor_data[0]['id']

        # Mark all notifications as read
        notification_service = NotificationPersistenceService()
        result = notification_service.mark_all_as_read(investor_id)

        if result['success']:
            return result
        else:
            raise HTTPException(status_code=500, detail=result.get('error', 'Unknown error'))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking all notifications as read: {str(e)}")

@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, authorization: Optional[str] = Header(None)):
    """Delete a notification."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    session_token = authorization
    if authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")

    try:
        # Get user from session
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)

        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")

        # Get investor ID from user email (notifications reference investors table)
        investor_response = dashboard_service.supabase.table('investors').select('id').eq('email', user['email']).execute()
        investor_data = getattr(investor_response, 'data', [])

        if not investor_data:
            raise HTTPException(status_code=404, detail="Investor not found")

        investor_id = investor_data[0]['id']

        # Delete notification
        notification_service = NotificationPersistenceService()
        result = notification_service.delete_notification(investor_id, notification_id)

        if result['success']:
            return result
        else:
            raise HTTPException(status_code=500, detail=result.get('error', 'Unknown error'))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting notification: {str(e)}")

@router.delete("/")
async def clear_all_notifications(authorization: Optional[str] = Header(None)):
    """Clear all notifications."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    session_token = authorization
    if authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")

    try:
        # Get user from session
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)

        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")

        # Get investor ID from user email (notifications reference investors table)
        investor_response = dashboard_service.supabase.table('investors').select('id').eq('email', user['email']).execute()
        investor_data = getattr(investor_response, 'data', [])

        if not investor_data:
            raise HTTPException(status_code=404, detail="Investor not found")

        investor_id = investor_data[0]['id']

        # Clear all notifications
        notification_service = NotificationPersistenceService()
        result = notification_service.clear_all_notifications(investor_id)

        if result['success']:
            return result
        else:
            raise HTTPException(status_code=500, detail=result.get('error', 'Unknown error'))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing notifications: {str(e)}")

@router.post("/create")
async def create_notification(
    request: CreateNotificationRequest,
    authorization: Optional[str] = Header(None)
):
    """Create a new notification."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    session_token = authorization
    if authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")

    try:
        # Get user from session to get user_id
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)

        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")

        # Use the user ID directly (notifications now reference users table)
        user_id = user['id']

        # Create notification
        notification_service = NotificationPersistenceService()
        result = notification_service.create_notification(
            investor_id=request.investor_id or user_id,  # Use user ID for notifications
            title=request.title,
            message=request.message,
            notification_type=request.type,
            event_type=request.event_type,
            metadata=request.metadata
        )

        if result['success']:
            return result
        else:
            raise HTTPException(status_code=500, detail=result.get('error', 'Unknown error'))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating notification: {str(e)}")
