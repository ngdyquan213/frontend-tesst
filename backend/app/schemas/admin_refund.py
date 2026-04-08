from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import RefundStatus


class AdminRefundResponse(BaseModel):
    id: str
    payment_id: str
    amount: Decimal
    currency: str
    status: RefundStatus
    reason: str | None = None
    processed_at: datetime | None = None
    created_at: datetime


class AdminRefundUpdateRequest(BaseModel):
    status: RefundStatus
    reason: str | None = Field(default=None, max_length=500)
