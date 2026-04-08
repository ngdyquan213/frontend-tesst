from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import (
    build_admin_service,
    get_pagination_params,
    require_permission,
)
from app.core.constants import PERM_ADMIN_AUDIT_LOGS_READ, PERM_ADMIN_PAYMENTS_READ
from app.core.database import get_db
from app.schemas.admin import AdminAuditLogResponse, AdminPaymentResponse
from app.schemas.common import PaginatedResponse
from app.utils.pagination import PaginationParams, build_paginated_response
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import admin_audit_log_to_dict, admin_payment_to_dict

router = APIRouter(prefix="/admin", tags=["admin-payments"])


@router.get("/payments", response_model=PaginatedResponse[AdminPaymentResponse])
def list_payments(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user=Depends(require_permission(PERM_ADMIN_PAYMENTS_READ)),
    db: Session = Depends(get_db),
):
    service = build_admin_service(db, include_audit_service=True)
    payments, total = service.list_payments_page(
        skip=pagination.offset,
        limit=pagination.limit,
        page=pagination.page,
        page_size=pagination.page_size,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    items = [
        AdminPaymentResponse(**admin_payment_to_dict(p)).model_dump(mode="json") for p in payments
    ]

    return build_paginated_response(
        items=items,
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )


@router.get("/audit-logs", response_model=PaginatedResponse[AdminAuditLogResponse])
def list_audit_logs(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user=Depends(require_permission(PERM_ADMIN_AUDIT_LOGS_READ)),
    db: Session = Depends(get_db),
):
    service = build_admin_service(db, include_audit_service=True)
    logs, total = service.list_audit_logs_page(
        skip=pagination.offset,
        limit=pagination.limit,
        page=pagination.page,
        page_size=pagination.page_size,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    items = [
        AdminAuditLogResponse(**admin_audit_log_to_dict(log)).model_dump(mode="json")
        for log in logs
    ]

    return build_paginated_response(
        items=items,
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )
