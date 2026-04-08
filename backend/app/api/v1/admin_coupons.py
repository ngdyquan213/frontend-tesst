from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.deps import (
    build_admin_coupon_service,
    get_pagination_params,
    require_permission,
)
from app.core.constants import PERM_ADMIN_COUPONS_READ, PERM_ADMIN_COUPONS_WRITE
from app.core.database import get_db
from app.schemas.admin_bulk import BulkActionItemResult, BulkActionResponse, BulkIdsRequest
from app.schemas.admin_coupon import (
    AdminCouponCreateRequest,
    AdminCouponResponse,
    AdminCouponUpdateRequest,
)
from app.schemas.common import PaginatedResponse
from app.utils.pagination import PaginationParams, build_paginated_response
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import admin_coupon_to_dict

router = APIRouter(prefix="/admin", tags=["admin-coupons"])


@router.get("/coupons", response_model=PaginatedResponse[AdminCouponResponse])
def list_coupons(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user=Depends(require_permission(PERM_ADMIN_COUPONS_READ)),
    db: Session = Depends(get_db),
):
    service = build_admin_coupon_service(db)
    coupons, total = service.list_coupons(
        skip=pagination.offset,
        limit=pagination.limit,
        page=pagination.page,
        page_size=pagination.page_size,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    items = [
        AdminCouponResponse(**admin_coupon_to_dict(c)).model_dump(mode="json") for c in coupons
    ]

    return build_paginated_response(
        items=items,
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )


@router.post("/coupons", response_model=AdminCouponResponse, status_code=status.HTTP_201_CREATED)
def create_coupon(
    payload: AdminCouponCreateRequest,
    request: Request,
    current_user=Depends(require_permission(PERM_ADMIN_COUPONS_WRITE)),
    db: Session = Depends(get_db),
) -> AdminCouponResponse:
    service = build_admin_coupon_service(db)
    coupon = service.create_coupon(
        payload=payload,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return AdminCouponResponse(**admin_coupon_to_dict(coupon))


@router.put("/coupons/{coupon_id}", response_model=AdminCouponResponse)
def update_coupon(
    coupon_id: str,
    payload: AdminCouponUpdateRequest,
    request: Request,
    current_user=Depends(require_permission(PERM_ADMIN_COUPONS_WRITE)),
    db: Session = Depends(get_db),
) -> AdminCouponResponse:
    service = build_admin_coupon_service(db)
    coupon = service.update_coupon(
        coupon_id=coupon_id,
        payload=payload,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return AdminCouponResponse(**admin_coupon_to_dict(coupon))


@router.post("/coupons/{coupon_id}/deactivate", response_model=AdminCouponResponse)
def deactivate_coupon(
    coupon_id: str,
    request: Request,
    current_user=Depends(require_permission(PERM_ADMIN_COUPONS_WRITE)),
    db: Session = Depends(get_db),
) -> AdminCouponResponse:
    service = build_admin_coupon_service(db)
    coupon = service.deactivate_coupon(
        coupon_id=coupon_id,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return AdminCouponResponse(**admin_coupon_to_dict(coupon))


@router.post("/coupons/bulk-deactivate", response_model=BulkActionResponse)
def bulk_deactivate_coupons(
    payload: BulkIdsRequest,
    request: Request,
    current_user=Depends(require_permission(PERM_ADMIN_COUPONS_WRITE)),
    db: Session = Depends(get_db),
) -> BulkActionResponse:
    service = build_admin_coupon_service(db)
    raw_results = service.bulk_deactivate_coupons(
        coupon_ids=payload.ids,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    results = [BulkActionItemResult(**item) for item in raw_results]
    return BulkActionResponse(
        total_requested=len(payload.ids),
        success_count=sum(1 for r in raw_results if r["success"]),
        failed_count=sum(1 for r in raw_results if not r["success"]),
        results=results,
    )
