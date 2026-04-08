from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import RefundStatus


class RefundCreateRequest(BaseModel):
    booking_id: str
    reason: str = Field(min_length=10, max_length=1000)


class RefundResponse(BaseModel):
    id: str
    payment_id: str
    booking_id: str | None = None
    amount: Decimal
    currency: str
    status: RefundStatus
    reason: str | None = None
    processed_at: datetime | None = None
    created_at: datetime
