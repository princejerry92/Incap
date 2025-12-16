"""
Admin Authentication Routes
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional
import random
import string
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from app.core.config import settings
from app.core.security import create_access_token
import supabase

router = APIRouter(prefix="/admin/auth", tags=["Admin Auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AdminInitRequest(BaseModel):
    username: str

class AdminLoginRequest(BaseModel):
    username: str
    password: str

def get_supabase_client():
    return supabase.create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

@router.post("/init")
async def init_admin_login(request: AdminInitRequest):
    """
    Initialize admin login: Check username, generate disposable password (OTP).
    """
    client = get_supabase_client()
    
    # Check if admin exists
    response = client.table('admin_settings').select('*').eq('username', request.username).execute()
    data = getattr(response, 'data', [])
    
    if not data:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    # Generate OTP
    otp = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
    otp_hash = pwd_context.hash(otp)
    otp_expires_at = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
    
    # Store OTP hash and expiry
    client.table('admin_settings').update({
        'otp_hash': otp_hash,
        'otp_expires_at': otp_expires_at
    }).eq('username', request.username).execute()
    
    return {
        "success": True,
        "message": "Disposable password generated",
        "password": otp,  # Return plaintext OTP for user to copy
        "expires_in": "5 minutes"
    }

@router.post("/login")
async def admin_login(request: AdminLoginRequest):
    """
    Admin login: Verify OTP and create session.
    """
    client = get_supabase_client()
    
    # Get admin data
    response = client.table('admin_settings').select('*').eq('username', request.username).execute()
    data = getattr(response, 'data', [])
    
    if not data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    admin = data[0]
    
    # Check OTP expiry
    if not admin.get('otp_expires_at'):
        raise HTTPException(status_code=401, detail="No active login request")
        
    expires_at = datetime.fromisoformat(admin['otp_expires_at'].replace('Z', '+00:00'))
    # Ensure expires_at is timezone-aware in UTC for safe comparison
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=401, detail="Password expired")
    
    # Verify OTP
    if not pwd_context.verify(request.password, admin['otp_hash']):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    # Login successful: Update last_login_time and clear OTP
    client.table('admin_settings').update({
        'last_login_time': datetime.now(timezone.utc).isoformat(),
        'otp_hash': None,
        'otp_expires_at': None
    }).eq('username', request.username).execute()
    
    # Create access token
    # Note: We use a special subject or claim to distinguish admin
    access_token = create_access_token(
        data={"sub": request.username, "role": "admin"},
        expires_delta=timedelta(hours=12) # Admin session lasts 12 hours
    )
    
    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/logout")
async def admin_logout(authorization: Optional[str] = Header(None)):
    """
    Logout (Client-side mostly, but we could blacklist token if needed)
    """
    return {"success": True, "message": "Logged out successfully"}
