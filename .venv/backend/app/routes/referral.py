"""
Referral routes for affiliate network and points system.
Provides endpoints for referral code management, points operations, and downlines.
"""

from fastapi import APIRouter, HTTPException, Query, Header
from typing import Optional
from pydantic import BaseModel
from ..services.referral_service import ReferralService
from ..services.dashboard import DashboardService

# Pydantic models
class RedeemPointsRequest(BaseModel):
    amount: int  # Number of points to redeem

# Create router
router = APIRouter(prefix="/referral", tags=["Referral System"])

@router.get("/code")
async def get_referral_code(authorization: Optional[str] = Header(None)):
    """Get the user's referral code."""
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
            raise HTTPException(status_code=401, detail="Invalid session")

        # Get referral code from user record
        referral_code = user.get('referral_code')
        if not referral_code:
            raise HTTPException(status_code=404, detail="Referral code not found")

        return {
            "success": True,
            "referral_code": referral_code
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting referral code: {str(e)}")

@router.post("/validate")
async def validate_referral_code(
    referral_code: str = Query(..., description="Referral code to validate"),
    authorization: Optional[str] = Header(None)
):
    """Validate a referral code."""
    # Extract token from "Bearer <token>" format if provided
    user_email = None
    if authorization:
        session_token = authorization
        if authorization.startswith("Bearer "):
            session_token = authorization.replace("Bearer ", "")

        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)
        if user:
            user_email = user.get('email')

    try:
        referral_service = ReferralService()
        result = referral_service.validate_referral_code(referral_code, user_email)

        if not result['success']:
            raise HTTPException(status_code=400, detail=result['error'])

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating referral code: {str(e)}")

@router.get("/stats")
async def get_referral_stats(authorization: Optional[str] = Header(None)):
    """Get user's referral statistics."""
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
            raise HTTPException(status_code=401, detail="Invalid session")

        referral_service = ReferralService()
        result = referral_service.get_referral_stats(user['id'])

        if not result['success']:
            raise HTTPException(status_code=500, detail=result['error'])

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting referral stats: {str(e)}")

@router.get("/points")
async def get_user_points(authorization: Optional[str] = Header(None)):
    """Get user's current points balance and statistics."""
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
            raise HTTPException(status_code=401, detail="Invalid session")

        referral_service = ReferralService()
        result = referral_service.get_user_points(user['id'])

        if not result['success']:
            raise HTTPException(status_code=500, detail=result['error'])

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting user points: {str(e)}")

@router.post("/redeem")
async def redeem_points(
    request: RedeemPointsRequest,
    authorization: Optional[str] = Header(None)
):
    """Redeem points for cash added to spending account."""
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
            raise HTTPException(status_code=401, detail="Invalid session")

        referral_service = ReferralService()
        result = referral_service.redeem_points(user['id'], request.amount)

        if not result['success']:
            raise HTTPException(status_code=400, detail=result['error'])

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error redeeming points: {str(e)}")

@router.get("/downlines")
async def get_downlines(authorization: Optional[str] = Header(None)):
    """Get user's referral downlines."""
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
            raise HTTPException(status_code=401, detail="Invalid session")

        referral_service = ReferralService()
        result = referral_service.get_downlines(user['id'])

        if not result['success']:
            raise HTTPException(status_code=500, detail=result['error'])

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting downlines: {str(e)}")

@router.post("/award-points")
async def award_referral_points(
    referee_email: str = Query(..., description="Email of the user who created investor account")
):
    """Award points to referrer when referee creates investor account (internal endpoint)."""
    try:
        referral_service = ReferralService()
        result = referral_service.award_referral_points(referee_email)

        # This endpoint is typically called internally, so we don't need to return detailed error messages
        return result

    except Exception as e:
        return {"success": False, "error": f"Error awarding referral points: {str(e)}"}
