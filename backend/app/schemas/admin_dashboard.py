from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import BookingStatus, LogActorType, PaymentStatus, RefundStatus


class BookingStatusCountItem(BaseModel):
    status: BookingStatus
    count: int


class PaymentStatusCountItem(BaseModel):
    status: PaymentStatus
    count: int


class RefundStatusCountItem(BaseModel):
    status: RefundStatus
    count: int


class RevenueSummaryResponse(BaseModel):
    total_paid_amount: Decimal
    total_refunded_amount: Decimal
    net_revenue_amount: Decimal
    currency: str


class RecentActivityItem(BaseModel):
    audit_log_id: str
    actor_type: LogActorType
    actor_user_id: str | None
    action: str
    resource_type: str | None
    resource_id: str | None
    created_at: datetime


class AdminDashboardSummaryResponse(BaseModel):
    booking_status_counts: list[BookingStatusCountItem]
    payment_status_counts: list[PaymentStatusCountItem]
    refund_status_counts: list[RefundStatusCountItem]
    revenue: RevenueSummaryResponse
    recent_activities: list[RecentActivityItem]
