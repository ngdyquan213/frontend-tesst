from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.deps import (
    build_admin_service,
    get_pagination_params,
    require_permission,
)
from app.core.constants import PERM_ADMIN_BOOKINGS_READ
from app.core.database import get_db
from app.models.enums import BookingStatus, PaymentStatus
from app.schemas.admin import AdminBookingResponse
from app.schemas.common import PaginatedResponse
from app.utils.pagination import PaginationParams, build_paginated_response
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import admin_booking_to_dict

router = APIRouter(prefix="/admin", tags=["admin-bookings"])


@router.get("/bookings", response_model=PaginatedResponse[AdminBookingResponse])
def list_bookings(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination_params),
    status: BookingStatus | None = Query(default=None),
    payment_status: PaymentStatus | None = Query(default=None),
    booking_code: str | None = Query(default=None),
    sort_by: str = Query(default="booked_at"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    current_user=Depends(require_permission(PERM_ADMIN_BOOKINGS_READ)),
    db: Session = Depends(get_db),
):
    service = build_admin_service(db, include_audit_service=True)
    bookings, total = service.list_bookings_page(
        skip=pagination.offset,
        limit=pagination.limit,
        page=pagination.page,
        page_size=pagination.page_size,
        actor_user_id=current_user.id,
        status=status,
        payment_status=payment_status,
        booking_code=booking_code,
        sort_by=sort_by,
        sort_order=sort_order,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    items = [admin_booking_to_dict(b) for b in bookings]

    return build_paginated_response(
        items=items,
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )
