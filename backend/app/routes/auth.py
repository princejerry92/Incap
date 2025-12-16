import os
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request
from starlette.config import Config
from ..core.config import settings
from supabase import create_client, Client
from datetime import datetime, timedelta
import uuid
from passlib.hash import bcrypt
import base64
import random
import string
from ..services.referral_service import ReferralService
from ..services.notification_service import NotificationService
from ..services.email_service import EmailService
from ..services.investors import InvestorService

# Create router
router = APIRouter(prefix="/auth", tags=["Authentication"])

# Initialize Supabase client
supabase_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

# OAuth configuration
oauth = OAuth()

# Register Google OAuth
google_client = oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

def create_session_token():
    """Create a session token with 6-hour expiration"""
    return str(uuid.uuid4())

def is_session_valid(created_at):
    """Check if session is still valid (within 6 hours)"""
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
    return datetime.now(created_at.tzinfo) < created_at + timedelta(hours=6)

@router.get("/google/login")
async def google_login(request: Request):
    """Initiate Google OAuth login"""
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await google_client.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def google_callback(request: Request):
    """Handle Google OAuth callback"""
    try:
        # Get the token
        token = await google_client.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        if user_info:
            # Extract user data
            email = user_info.get('email')
            first_name = user_info.get('given_name', '')
            surname = user_info.get('family_name', '')
            profile_pic = user_info.get('picture', '')
            
            # Check if user exists in database
            user_response = supabase_client.table('users').select('*').eq('email', email).execute()
            
            # Handle response correctly
            user_data = getattr(user_response, 'data', [])
            if user_data and len(user_data) > 0:
                # User exists, update last login
                user_id = user_data[0]['id']
                supabase_client.table('users').update({
                    'last_login': datetime.now().isoformat()
                }).eq('id', user_id).execute()
            else:
                                # Create new user
                user_data = {
                    'email': email,
                    'first_name': first_name,
                    'surname': surname,
                    'profile_pic': profile_pic,
                    'date_of_birth': None,
                    'phone_number': None,
                    'address': None,
                    'security_question': None,
                    'security_answer_hash': None,
                    'created_at': datetime.now().isoformat(),
                    'last_login': datetime.now().isoformat()
                }
                insert_response = supabase_client.table('users').insert(user_data).execute()
                insert_data = getattr(insert_response, 'data', [])
                user_id = insert_data[0]['id'] if insert_data and len(insert_data) > 0 else None

                # Assign referral code and create points record for new Google OAuth users
                if user_id:
                    referral_service = ReferralService()
                    referral_result = referral_service.assign_referral_code_to_user(user_id)
                    if not referral_result['success']:
                        # Log error but don't fail OAuth signup
                        print(f"Warning: Failed to assign referral code to Google OAuth user {user_id}: {referral_result['error']}")
            
        # Create session
        session_token = create_session_token()
        session_data = {
            'user_id': user_id,
            'token': session_token,
            'created_at': datetime.now().isoformat(),
            'expires_at': (datetime.now() + timedelta(hours=6)).isoformat()
        }
        supabase_client.table('sessions').insert(session_data).execute()

        # Redirect to frontend callback with session token
        redirect_url = f"{settings.FRONTEND_URL}/auth/google/callback?session_token={session_token}"
        return RedirectResponse(url=redirect_url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Google OAuth error: {str(e)}")

@router.get("/logout")
async def logout(session_token: str):
    """Logout endpoint - invalidate session"""
    try:
        # Delete session from database
        supabase_client.table('sessions').delete().eq('token', session_token).execute()
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logout error: {str(e)}")

@router.delete("/delete-account")
async def delete_account(session_token: str):
    """Delete user account and all associated data"""
    try:
        # Verify session
        session_response = supabase_client.table('sessions').select('*').eq('token', session_token).execute()
        session_data = getattr(session_response, 'data', [])
        
        if not session_data or len(session_data) == 0:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        session = session_data[0]
        user_id = session['user_id']
        
        # Check if session is still valid
        if not is_session_valid(session['created_at']):
            # Session expired, delete it
            supabase_client.table('sessions').delete().eq('token', session_token).execute()
            raise HTTPException(status_code=401, detail="Session expired")
        
        # Get user data before deletion
        user_response = supabase_client.table('users').select('*').eq('id', user_id).execute()
        user_data = getattr(user_response, 'data', [])
        
        if not user_data or len(user_data) == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_data[0]
        user_email = user['email']
        
        # Delete all user-related data with cascade deletes
        # The database schema has ON DELETE CASCADE constraints which will handle:
        # - sessions (already handled by user deletion)
        # - password_reset_codes
        # - user_investments
        # - investors (through user_investments cascade)
        # - transactions (through investors cascade)
        # - notifications (through investors cascade)
        # - spending_accounts (through investors cascade)
        # - topups (through investors cascade)
        
        # Delete the user, which will cascade to all related tables
        supabase_client.table('users').delete().eq('id', user_id).execute()
        
        # Send account deletion notification email
        try:
            email_service = EmailService()
            email_service.send_account_deletion_email(user_email)
        except Exception as e:
            # Log error but don't fail the request
            print(f"Failed to send account deletion email: {str(e)}")
        
        return {"message": "Account successfully deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Account deletion error: {str(e)}")

@router.get("/verify-session")
async def verify_session(session_token: str):
    """Verify if session is still valid"""
    try:
        # Get session from database
        session_response = supabase_client.table('sessions').select('*').eq('token', session_token).execute()
        session_data = getattr(session_response, 'data', [])
        
        if not session_data or len(session_data) == 0:
            return {"valid": False, "message": "Session not found"}
        
        session = session_data[0]
        if is_session_valid(session['created_at']):
            # Get user data
            user_response = supabase_client.table('users').select('*').eq('id', session['user_id']).execute()
            user_data = getattr(user_response, 'data', [])
            if user_data and len(user_data) > 0:
                return {
                    "valid": True,
                    "user": user_data[0],
                    "message": "Session is valid"
                }
            else:
                return {"valid": False, "message": "User not found"}
        else:
            # Session expired, delete it
            supabase_client.table('sessions').delete().eq('token', session_token).execute()
            return {"valid": False, "message": "Session expired"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Session verification error: {str(e)}")

@router.post("/login")
async def manual_login(
    email: str = Form(...),
    password: str = Form(...)
):
    """Manual user login with email and password"""
    try:
        # Check if user exists in database
        user_response = supabase_client.table('users').select('*').eq('email', email).execute()
        user_data = getattr(user_response, 'data', [])

        if not user_data or len(user_data) == 0:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user = user_data[0]

        # Check if user has a password hash (for manual signup users)
        if not user.get('password_hash'):
            raise HTTPException(status_code=401, detail="This account was created with Google OAuth. Please use Google login.")

        # Verify password
        if not bcrypt.verify(password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Update last login
        supabase_client.table('users').update({
            'last_login': datetime.now().isoformat()
        }).eq('id', user['id']).execute()

        # Create session
        session_token = create_session_token()
        session_data = {
            'user_id': user['id'],
            'token': session_token,
            'created_at': datetime.now().isoformat(),
            'expires_at': (datetime.now() + timedelta(hours=6)).isoformat()
        }
        supabase_client.table('sessions').insert(session_data).execute()

        return {
            "success": True,
            "message": "Login successful",
            "session_token": session_token,
            "user": {
                "id": user['id'],
                "email": user['email'],
                "first_name": user['first_name'],
                "surname": user['surname']
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")

@router.get("/check-email")
async def check_email(email: str = Query(..., description="Email address to check")):
    """Check if email is already registered"""
    try:
        # Check if user exists in database
        response = supabase_client.table('users').select('id').eq('email', email).execute()
        user_data = getattr(response, 'data', [])

        available = len(user_data) == 0
        return {
            "available": available,
            "message": "Email available" if available else "Email already exists"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email check error: {str(e)}")

@router.post("/signup")
async def manual_signup(
    firstName: str = Form(...),
    surname: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    phoneNumber: str = Form(...),
    address: str = Form(...),
    dateOfBirth: str = Form(...),
    securityQuestion: str = Form(...),
    securityAnswer: str = Form(...),
    referralCode: str = Form(None),  # Optional referral code
    profilePic: str = Form(None)  # base64 encoded image
):
    """Manual user signup"""
    try:
        # Check if user already exists
        existing_response = supabase_client.table('users').select('id').eq('email', email).execute()
        existing_data = getattr(existing_response, 'data', [])

        if existing_data and len(existing_data) > 0:
            raise HTTPException(status_code=400, detail="Email already exists")

        # Validate referral code if provided
        referrer_id = None
        if referralCode and referralCode.strip():
            referral_service = ReferralService()
            validation_result = referral_service.validate_referral_code(referralCode.strip(), email)
            if not validation_result['success']:
                raise HTTPException(status_code=400, detail=validation_result['error'])
            referrer_id = validation_result['referrer']['id']

        # Hash password and security answer
        password_hash = bcrypt.hash(password)
        security_answer_hash = bcrypt.hash(securityAnswer.strip().lower())

        # Handle profile picture (base64 to binary if provided)
        profile_pic_data = None
        if profilePic and profilePic.startswith('data:image/'):
            # Extract base64 data
            try:
                header, encoded = profilePic.split(',', 1)
                profile_pic_data = base64.b64decode(encoded)
            except:
                profile_pic_data = None

        # Create user data
        user_data = {
            'email': email,
            'first_name': firstName,
            'surname': surname,
            'phone_number': phoneNumber,
            'address': address,
            'date_of_birth': dateOfBirth,
            'security_question': securityQuestion,
            'security_answer_hash': security_answer_hash,
            'password_hash': password_hash,
            'profile_pic': profile_pic_data,  # This might need to be uploaded to Supabase storage instead
            'created_at': datetime.now().isoformat(),
            'last_login': datetime.now().isoformat()
        }

        # Insert new user
        insert_response = supabase_client.table('users').insert(user_data).execute()
        insert_data = getattr(insert_response, 'data', [])

        if not insert_data or len(insert_data) == 0:
            raise HTTPException(status_code=500, detail="Failed to create user")

        user_id = insert_data[0]['id']

        # Assign referral code and create points record
        referral_service = ReferralService()
        referral_result = referral_service.assign_referral_code_to_user(user_id)
        if not referral_result['success']:
            # Log error but don't fail signup
            print(f"Warning: Failed to assign referral code to user {user_id}: {referral_result['error']}")

        # Record referral usage if referral code was provided
        if referrer_id:
            referral_service.record_referral_usage(referrer_id, user_id, referralCode.strip())

        # Create session
        session_token = create_session_token()
        session_data = {
            'user_id': user_id,
            'token': session_token,
            'created_at': datetime.now().isoformat(),
            'expires_at': (datetime.now() + timedelta(hours=6)).isoformat()
        }
        supabase_client.table('sessions').insert(session_data).execute()

        response_data = {
            "success": True,
            "message": "User created successfully",
            "session_token": session_token
        }

        # Include referral code in response if successfully assigned
        if referral_result['success']:
            response_data['referral_code'] = referral_result['referral_code']

        return response_data

    except HTTPException:
        raise
    except Exception as e:
        error_detail = str(e)
        if "Email already exists" in error_detail:
            raise HTTPException(status_code=400, detail="Email already exists")
        raise HTTPException(status_code=500, detail=f"Signup error: {error_detail}")

@router.post("/forgot-password/request")
async def request_password_reset(email: str = Form(...)):
    """Request a password reset by sending a code to the user's email"""
    try:
        # Check if user exists
        user_response = supabase_client.table('users').select('*').eq('email', email).execute()
        user_data = getattr(user_response, 'data', [])
        
        if not user_data or len(user_data) == 0:
            # For security reasons, we don't reveal if the email exists
            return {"message": "If the email exists, a reset code has been sent."}
        
        user = user_data[0]
        
        # Generate a 6-digit reset code
        reset_code = ''.join(random.choices(string.digits, k=6))
        
        # Hash the reset code for storage
        reset_code_hash = bcrypt.hash(reset_code)
        
        # Calculate expiration time (10 minutes from now)
        expires_at = datetime.now() + timedelta(minutes=10)
        
        # Store the reset code in the database
        reset_data = {
            'user_id': user['id'],
            'reset_code': reset_code_hash,
            'expires_at': expires_at.isoformat()
        }
        
        supabase_client.table('password_reset_codes').insert(reset_data).execute()
        
        # Send the reset code via email using MailerSend
        email_service = EmailService()
        try:
            email_service.send_password_reset_email(email, reset_code)
        except Exception as e:
            # Log the error but don't fail the request
            print(f"Failed to send email: {str(e)}")
        
        return {
            "message": "Reset code sent to your email address.",
            # Remove the code from response in production
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Password reset request error: {str(e)}")

@router.post("/forgot-password/verify-code")
async def verify_reset_code(email: str = Form(...), code: str = Form(...)):
    """Verify the password reset code"""
    try:
        # Check if user exists
        user_response = supabase_client.table('users').select('*').eq('email', email).execute()
        user_data = getattr(user_response, 'data', [])
        
        if not user_data or len(user_data) == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_data[0]
        
        # Get the most recent reset code for this user
        reset_response = supabase_client.table('password_reset_codes')\
            .select('*')\
            .eq('user_id', user['id'])\
            .eq('used', False)\
            .order('created_at', desc=True)\
            .limit(1)\
            .execute()
        
        reset_data = getattr(reset_response, 'data', [])
        
        if not reset_data or len(reset_data) == 0:
            raise HTTPException(status_code=400, detail="No reset code found for this user")
        
        reset_record = reset_data[0]
        
        # Check if the code has expired
        expires_at = datetime.fromisoformat(reset_record['expires_at'].replace('Z', '+00:00'))
        if datetime.now(expires_at.tzinfo) > expires_at:
            raise HTTPException(status_code=400, detail="Reset code has expired")
        
        # Verify the code
        if not bcrypt.verify(code, reset_record['reset_code']):
            raise HTTPException(status_code=400, detail="Invalid reset code")
        
        # Mark the code as used
        supabase_client.table('password_reset_codes')\
            .update({'used': True})\
            .eq('id', reset_record['id'])\
            .execute()
        
        return {
            "message": "Reset code verified successfully",
            "user_id": user['id']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code verification error: {str(e)}")

@router.post("/forgot-password/reset")
async def reset_password(
    email: str = Form(...),
    new_password: str = Form(...),
    confirm_password: str = Form(...)
):
    """Reset the user's password"""
    try:
        # Check if passwords match
        if new_password != confirm_password:
            raise HTTPException(status_code=400, detail="Passwords do not match")
        
        # Validate password strength (same as signup)
        if len(new_password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        
        # Check for special characters
        special_char_regex = r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]"
        import re
        if not re.search(special_char_regex, new_password):
            raise HTTPException(status_code=400, detail="Password must contain special characters")
        
        # Check if user exists
        user_response = supabase_client.table('users').select('*').eq('email', email).execute()
        user_data = getattr(user_response, 'data', [])
        
        if not user_data or len(user_data) == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_data[0]
        
        # Hash the new password
        password_hash = bcrypt.hash(new_password)
        
        # Update the user's password
        supabase_client.table('users')\
            .update({'password_hash': password_hash})\
            .eq('id', user['id'])\
            .execute()
        
        # Send password reset success email
        email_service = EmailService()
        try:
            email_service.send_password_reset_success_email(email)
        except Exception as e:
            # Log the error but don't fail the request
            print(f"Failed to send success email: {str(e)}")
        
        # Create notification
        notification = NotificationService.generate_account_updated_notification(
            investor_id=user['id'],
            message="Your password has been successfully changed. If you didn't authorize this change, please contact support immediately."
        )
        
        return {
            "success": True,
            "message": "Password reset successfully",
            "notification": notification
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Password reset error: {str(e)}")

@router.post("/forgot-password/security-question")
async def verify_security_question(
    email: str = Form(...),
    answer: str = Form(...)
):
    """Verify the user's security question answer"""
    try:
        # Check if user exists
        user_response = supabase_client.table('users').select('*').eq('email', email).execute()
        user_data = getattr(user_response, 'data', [])
        
        if not user_data or len(user_data) == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_data[0]
        
        # Check if user has a security question and answer
        if not user.get('security_question') or not user.get('security_answer_hash'):
            raise HTTPException(status_code=400, detail="No security question found for this user")
        
        # Verify the security answer
        if not bcrypt.verify(answer.strip().lower(), user['security_answer_hash']):
            raise HTTPException(status_code=400, detail="Incorrect security answer")
        
        return {
            "message": "Security question verified successfully",
            "user_id": user['id']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Security question verification error: {str(e)}")

@router.get("/security-question")
async def get_security_question(email: str = Query(..., description="Email address to get security question for")):
    """Get the security question for a user by email"""
    try:
        # Check if user exists
        user_response = supabase_client.table('users').select('security_question').eq('email', email).execute()
        user_data = getattr(user_response, 'data', [])
        
        if not user_data or len(user_data) == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_data[0]
        
        # Check if user has a security question
        if not user.get('security_question'):
            raise HTTPException(status_code=400, detail="No security question found for this user")
        
        return {
            "security_question": user['security_question']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching security question: {str(e)}")

@router.post("/add-account")
async def add_account(request: Request, session_token: str = Query(..., description="Session token for authentication")):
    """Add a new investor account for an existing user"""
    try:
        # Verify session
        session_response = supabase_client.table('sessions').select('*').eq('token', session_token).execute()
        session_data = getattr(session_response, 'data', [])
        
        if not session_data or len(session_data) == 0:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        session = session_data[0]
        user_id = session['user_id']
        
        # Check if session is still valid
        if not is_session_valid(session['created_at']):
            # Session expired, delete it
            supabase_client.table('sessions').delete().eq('token', session_token).execute()
            raise HTTPException(status_code=401, detail="Session expired")
        
        # Get user data
        user_response = supabase_client.table('users').select('*').eq('id', user_id).execute()
        user_data = getattr(user_response, 'data', [])
        
        if not user_data or len(user_data) == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_data[0]
        
        # Get payload data
        payload = await request.json()
        
        # Add user email to payload to ensure consistency
        payload['email'] = user['email']
        
        # Check if email already exists in investors table
        existing_investor_response = supabase_client.table('investors').select('id').eq('email', user['email']).execute()
        existing_investor_data = getattr(existing_investor_response, 'data', [])
        
        if existing_investor_data and len(existing_investor_data) > 0:
            raise HTTPException(status_code=400, detail="An investment account already exists for this email")
        
        # Create investor using InvestorService
        try:
            svc = InvestorService()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Service init error: {e}")
        
        # Remove any accountNumber from payload to ensure server-side generation
        if 'accountNumber' in payload:
            del payload['accountNumber']
        
        res = svc.create_investor(payload)
        if not res.get('success'):
            raise HTTPException(status_code=400, detail=res.get('error'))
        
        record = res.get('data') or {}
        # Remove sensitive fields before returning to frontend
        record.pop('pin_hash', None)
        
        # Link user to investor account
        user_investment_data = {
            'user_id': user_id,
            'investor_id': record['id'],
            'is_primary': False  # Additional accounts are not primary
        }
        
        supabase_client.table('user_investments').insert(user_investment_data).execute()
        
        # Return only fields safe for frontend; ensure account_number is included
        return {
            'success': True,
            'message': 'Investment account created successfully',
            'data': {
                'id': record.get('id'),
                'account_number': record.get('account_number'),
                'email': record.get('email'),
                'first_name': record.get('first_name'),
                'surname': record.get('surname'),
                'initial_investment': record.get('initial_investment'),
                'portfolio_type': record.get('portfolio_type'),
                'status': record.get('status')
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Add account error: {str(e)}")
