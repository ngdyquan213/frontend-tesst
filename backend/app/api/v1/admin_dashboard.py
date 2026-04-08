from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.deps import build_admin_dashboard_service, require_permission
from app.core.constants import PERM_ADMIN_DASHBOARD_READ
from app.core.database import get_db
from app.schemas.admin_dashboard import (
    AdminDashboardSummaryResponse,
    BookingStatusCountItem,
    PaymentStatusCountItem,
    RecentActivityItem,
    RefundStatusCountItem,
    RevenueSummaryResponse,
)
from app.utils.enums import enum_to_str
from app.utils.request_context import get_client_ip, get_user_agent

router = APIRouter(prefix="/admin", tags=["admin-dashboard"])


@router.get("/dashboard/summary", response_model=AdminDashboardSummaryResponse)
def get_admin_dashboard_summary(
    request: Request,
    recent_limit: int = Query(default=10, ge=1, le=50),
    current_user=Depends(require_permission(PERM_ADMIN_DASHBOARD_READ)),
    db: Session = Depends(get_db),
) -> AdminDashboardSummaryResponse:
    dashboard_service = build_admin_dashboard_service(db)
    summary = dashboard_service.get_dashboard_summary_for_admin(
        actor_user_id=current_user.id,
        recent_limit=recent_limit,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return AdminDashboardSummaryResponse(
        booking_status_counts=[
            BookingStatusCountItem(**item) for item in summary["booking_status_counts"]
        ],
        payment_status_counts=[
            PaymentStatusCountItem(**item) for item in summary["payment_status_counts"]
        ],
        refund_status_counts=[
            RefundStatusCountItem(**item) for item in summary["refund_status_counts"]
        ],
        revenue=RevenueSummaryResponse(**summary["revenue"]),
        recent_activities=[
            RecentActivityItem(
                audit_log_id=str(log.id),
                actor_type=enum_to_str(log.actor_type),
                actor_user_id=str(log.actor_user_id) if log.actor_user_id else None,
                action=log.action,
                resource_type=log.resource_type,
                resource_id=str(log.resource_id) if log.resource_id else None,
                created_at=log.created_at,
            )
            for log in summary["recent_activities"]
        ],
    )
