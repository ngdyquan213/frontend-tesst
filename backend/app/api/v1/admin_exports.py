from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import build_admin_export_service, require_permission
from app.core.constants import PERM_ADMIN_EXPORTS_READ
from app.core.database import get_db
from app.models.enums import BookingStatus, PaymentStatus, RefundStatus
from app.utils.request_context import get_client_ip, get_user_agent

router = APIRouter(prefix="/admin", tags=["admin-exports"])


@router.get("/bookings/export.csv")
def export_bookings_csv(
    request: Request,
    status: BookingStatus | None = Query(default=None),
    payment_status: PaymentStatus | None = Query(default=None),
    booking_code: str | None = Query(default=None),
    sort_by: str = Query(default="booked_at"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    current_user=Depends(require_permission(PERM_ADMIN_EXPORTS_READ)),
    db: Session = Depends(get_db),
):
    export_service = build_admin_export_service(db)
    csv_bytes = export_service.export_bookings_csv(
        status=status,
        payment_status=payment_status,
        booking_code=booking_code,
        sort_by=sort_by,
        sort_order=sort_order,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    filename = f"bookings_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/refunds/export.csv")
def export_refunds_csv(
    request: Request,
    status: RefundStatus | None = Query(default=None),
    payment_id: str | None = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    current_user=Depends(require_permission(PERM_ADMIN_EXPORTS_READ)),
    db: Session = Depends(get_db),
):
    export_service = build_admin_export_service(db)
    csv_bytes = export_service.export_refunds_csv(
        status=status,
        payment_id=payment_id,
        sort_by=sort_by,
        sort_order=sort_order,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    filename = f"refunds_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/audit-logs/export.csv")
def export_audit_logs_csv(
    request: Request,
    current_user=Depends(require_permission(PERM_ADMIN_EXPORTS_READ)),
    db: Session = Depends(get_db),
):
    export_service = build_admin_export_service(db)
    csv_bytes = export_service.export_audit_logs_csv(
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    filename = f"audit_logs_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
