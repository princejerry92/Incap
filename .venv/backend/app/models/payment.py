from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from datetime import datetime

class PaymentInitRequest(BaseModel):
    email: EmailStr
    amount: float = Field(..., description="Amount in Naira")
    portfolio_type: str
    investor_data: Optional[Dict[str, Any]] = None  # Add investor data
    metadata: Optional[Dict[str, Any]] = None
    callback_url: Optional[str] = None

class PaymentVerifyRequest(BaseModel):
    reference: str

class PaymentResponse(BaseModel):
    status: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class TransactionRecord(BaseModel):
    id: Optional[int] = None
    user_id: int
    reference: str
    amount: float
    status: str
    portfolio_type: str
    email: str
    paid_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None