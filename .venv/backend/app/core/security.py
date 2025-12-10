from fastapi import Depends, HTTPException, Query
import jwt
from supabase import create_client, Client
from datetime import datetime, timedelta, timezone
from ..core.config import settings

# Initialize Supabase client
supabase_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def is_session_valid(created_at):
    """Check if session is still valid (within 6 hours)"""
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
    return datetime.now(created_at.tzinfo) < created_at + timedelta(hours=6)

async def get_current_user_id(session_token: str = Query(..., description="Session token for authentication")):
    """Dependency to get current user ID from session token"""
    try:
        # Get session from database
        session_response = supabase_client.table('sessions').select('*').eq('token', session_token).execute()
        session_data = getattr(session_response, 'data', [])

        if not session_data or len(session_data) == 0:
            raise HTTPException(status_code=401, detail="Invalid session")

        session = session_data[0]

        # Check if session is still valid
        if not is_session_valid(session['created_at']):
            # Session expired, delete it
            supabase_client.table('sessions').delete().eq('token', session_token).execute()
            raise HTTPException(status_code=401, detail="Session expired")

        return session['user_id']

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT access token.

    This helper generates a JWT token signed using the application SECRET_KEY. The
    token contains the provided data and an `exp` claim based on `expires_delta`.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta if expires_delta else timedelta(hours=6))
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    # In PyJWT 2.x the return type is a str; for 1.x it may be bytes
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    return token


def verify_access_token(token: str) -> dict:
    """Decode and verify a JWT access token. Returns the decoded claims on success."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
