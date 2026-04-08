from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.deps import (
    build_admin_bulk_service,
    build_admin_service,
    get_pagination_params,
    require_permission,
)
from app.core.constants import PERM_ADMIN_REFUNDS_READ, PERM_ADMIN_REFUNDS_WRITE
from app.core.database import get_db
from app.models.enums import RefundStatus
from app.schemas.admin import AdminBookingResponse
from app.schemas.admin_bulk import (
    BulkActionItemResult,
    BulkActionResponse,
    BulkRefundUpdateRequest,
)
from app.schemas.admin_refund import AdminRefundResponse, AdminRefundUpdateRequest
from app.schemas.common import PaginatedResponse
from app.utils.enums import enum_to_str
from app.utils.pagination import PaginationParams, build_paginated_response
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import admin_refund_to_dict

router = APIRouter(prefix="/admin", tags=["admin-refunds"])


@router.get("/cancelled-bookings", response_model=PaginatedResponse[AdminBookingResponse])
def list_cancelled_bookings(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user=Depends(require_permission(PERM_ADMIN_REFUNDS_READ)),
    db: Session = Depends(get_db),
):
    service = build_admin_service(db, include_audit_service=True)
    bookings, total = service.list_cancelled_bookings_page(
        skip=pagination.offset,
        limit=pagination.limit,
        page=pagination.page,
        page_size=pagination.page_size,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    items = [
        AdminBookingResponse(
            id=str(b.id),
            booking_code=b.booking_code,
            user_id=str(b.user_id),
            status=enum_to_str(b.status),
            total_final_amount=b.total_final_amount,
            currency=b.currency,
            payment_status=enum_to_str(b.payment_status),
            booked_at=b.booked_at,
        ).model_dump(mode="json")
        for b in bookings
    ]

    return build_paginated_response(
        items=items,
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )


@router.get("/refunds", response_model=PaginatedResponse[AdminRefundResponse])
def list_refunds(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination_params),
    status: RefundStatus | None = Query(default=None),
    payment_id: str | None = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    current_user=Depends(require_permission(PERM_ADMIN_REFUNDS_READ)),
    db: Session = Depends(get_db),
):
    service = build_admin_service(db, include_audit_service=True)
    refunds, total = service.list_refunds_page(
        skip=pagination.offset,
        limit=pagination.limit,
        page=pagination.page,
        page_size=pagination.page_size,
        actor_user_id=current_user.id,
        status=status,
        payment_id=payment_id,
        sort_by=sort_by,
        sort_order=sort_order,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    items = [admin_refund_to_dict(r) for r in refunds]

    return build_paginated_response(
        items=items,
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )


@router.put("/refunds/{refund_id}", response_model=AdminRefundResponse)
def update_refund_status(
    refund_id: str,
    payload: AdminRefundUpdateRequest,
    request: Request,
    current_user=Depends(require_permission(PERM_ADMIN_REFUNDS_WRITE)),
    db: Session = Depends(get_db),
) -> AdminRefundResponse:
    service = build_admin_service(
        db,
        include_payment_repo=True,
        include_audit_service=True,
    )
    refund = service.update_refund_status_with_audit(
        refund_id=refund_id,
        new_status=payload.status,
        reason=payload.reason,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return AdminRefundResponse(**admin_refund_to_dict(refund))


@router.post("/refunds/bulk-update", response_model=BulkActionResponse)
def bulk_update_refunds(
    payload: BulkRefundUpdateRequest,
    request: Request,
    current_user=Depends(require_permission(PERM_ADMIN_REFUNDS_WRITE)),
    db: Session = Depends(get_db),
) -> BulkActionResponse:
    bulk_service = build_admin_bulk_service(db)
    raw_results = bulk_service.bulk_update_refunds_with_audit(
        refund_ids=payload.refund_ids,
        status=payload.status,
        reason=payload.reason,
        actor_user_id=current_user.id,
        action="admin_bulk_update_refunds",
        resource_type="refund",
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
        metadata={
            "requested_ids": payload.refund_ids,
            "target_status": payload.status,
            "success_count": 0,
            "failed_count": 0,
        },
    )
    results = [BulkActionItemResult(**item) for item in raw_results]
    return BulkActionResponse(
        total_requested=len(payload.refund_ids),
        success_count=sum(1 for r in raw_results if r["success"]),
        failed_count=sum(1 for r in raw_results if not r["success"]),
        results=results,
    )
