import os
import sys
from dotenv import load_dotenv

if getattr(sys, 'frozen', False):
    # Running in PyInstaller bundle
    load_dotenv(os.path.join(sys._MEIPASS, '.env'))
else:
    # Running in development
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))


class Settings:
    PROJECT_NAME: str = os.getenv("APP_NAME", "FastAPI Application")

    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Redis
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))

    # Google Auth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "")

    # URLs
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:8000")

    # Security
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "your-secret-key-here-should-be-at-least-32-characters-long-change-in-production"
    )

    # Paystack
    PAYSTACK_SECRET_KEY: str = os.getenv("PAYSTACK_SECRET_KEY", "")
    PAYSTACK_PUBLIC_KEY: str = os.getenv("PAYSTACK_PUBLIC_KEY", "")
    PAYSTACK_BASE_URL: str = os.getenv("PAYSTACK_BASE_URL", "https://api.paystack.co")

    # MailerSend
    MAILERSEND_API: str = os.getenv("MAILERSEND_API", "")
    MAILERSEND_URL: str = os.getenv(
        "MAILERSEND_URL", "https://api.mailersend.com/v1/email"
    )


# Create the settings instance
settings = Settings()
