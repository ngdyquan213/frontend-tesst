from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr

from app.models.enums import BookingStatus, LogActorType, PaymentMethod, PaymentStatus, UserStatus


class AdminUserResponse(BaseModel):
    id: str
    email: EmailStr
    username: str | None = None
    full_name: str
    status: UserStatus


class AdminBookingResponse(BaseModel):
    id: str
    booking_code: str
    user_id: str
    status: BookingStatus
    total_final_amount: Decimal
    currency: str
    payment_status: PaymentStatus
    booked_at: datetime


class AdminPaymentResponse(BaseModel):
    id: str
    booking_id: str | None = None
    payment_method: PaymentMethod
    status: PaymentStatus
    amount: Decimal
    currency: str
    gateway_order_ref: str | None = None
    gateway_transaction_ref: str | None = None
    created_at: datetime


class AdminAuditLogResponse(BaseModel):
    id: str
    actor_type: LogActorType
    actor_user_id: str | None = None
    action: str
    resource_type: str
    resource_id: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: datetime
