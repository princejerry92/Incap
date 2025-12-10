"""
Customer Care Routes
API endpoints for customer support queries
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from typing import Optional
from fastapi import Form, Header
from fastapi import Depends  
from app.core.security import get_current_user_id
from app.services.customer_care_service import customer_care_service

router = APIRouter(prefix="/customer-care", tags=["customer-care"])

@router.post("/submit")
async def submit_query(
    category: str = Form(...),
    message: str = Form(...),
    attachment: Optional[UploadFile] = File(None),
    authorization: Optional[str] = Header(None)
):
    """
    Submit a customer query
    
    Args:
        category (str): Query category
        message (str): Query message
        attachment (UploadFile, optional): Attachment file
        authorization (str, optional): Authorization header
        
    Returns:
        JSONResponse: Result of the operation
    """
    try:
        # Validate authorization
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header required")
        
        session_token = authorization
        if authorization.startswith("Bearer "):
            session_token = authorization.replace("Bearer ", "")
            
        # Get user from session
        from app.services.dashboard import DashboardService
        dashboard_service = DashboardService()
        user = dashboard_service.get_user_by_session(session_token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
            
        user_id = user['id']
        
        attachment_url = None
        
        # Handle attachment upload if provided
        if attachment:
            # Read file content
            file_content = await attachment.read()
            
            # Upload to storage
            upload_result = await customer_care_service.upload_attachment(
                user_id=user_id,
                file_content=file_content,
                file_name=attachment.filename,
                content_type=attachment.content_type
            )
            
            if not upload_result["success"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to upload attachment: {upload_result['error']}"
                )
            
            attachment_url = upload_result["url"]
        
        # Submit query
        result = await customer_care_service.submit_query(
            user_id=user_id,
            category=category,
            message=message,
            attachment_url=attachment_url
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result["error"]
            )
        
        return JSONResponse(
            status_code=201,
            content={
                "success": True,
                "message": "Query submitted successfully",
                "data": result["data"]
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get("/queries")
async def get_user_queries(user_id: str = Depends(get_current_user_id)):
    """
    Get all queries for the authenticated user
    
    Args:
        user_id (str): Authenticated user ID
        
    Returns:
        JSONResponse: User queries
    """
    try:
        result = await customer_care_service.get_user_queries(user_id=user_id)
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result["error"]
            )
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": result["data"]
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
