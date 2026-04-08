from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import PaymentMethod, PaymentStatus


class PaymentInitiateRequest(BaseModel):
    booking_id: str
    payment_method: PaymentMethod


class PaymentResponse(BaseModel):
    id: str
    booking_id: str | None = None
    payment_method: PaymentMethod
    status: PaymentStatus
    amount: Decimal
    currency: str
    gateway_order_ref: str | None = None
    gateway_transaction_ref: str | None = None
    gateway_payload: dict | None = None
    paid_at: datetime | None = None


class PaymentStatusResponse(BaseModel):
    booking_id: str
    booking_payment_status: PaymentStatus | str
    payment: PaymentResponse | None = None


class PaymentCallbackRequest(BaseModel):
    gateway_name: str
    gateway_order_ref: str
    gateway_transaction_ref: str
    amount: Decimal
    currency: str
    status: str
    signature: str


class PaymentCallbackResponse(BaseModel):
    success: bool
    message: str
    id: str | None = None
    booking_id: str | None = None
    payment_method: PaymentMethod | None = None
    status: PaymentStatus | None = None
    amount: Decimal | None = None
    currency: str | None = None
    gateway_order_ref: str | None = None
    gateway_transaction_ref: str | None = None
    paid_at: datetime | None = None
