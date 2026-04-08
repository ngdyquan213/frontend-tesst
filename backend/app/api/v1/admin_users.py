from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import (
    build_admin_service,
    get_pagination_params,
    require_permission,
)
from app.core.constants import PERM_ADMIN_USERS_READ
from app.core.database import get_db
from app.schemas.admin import AdminUserResponse
from app.schemas.common import PaginatedResponse
from app.utils.pagination import PaginationParams, build_paginated_response
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import admin_user_to_dict

router = APIRouter(prefix="/admin", tags=["admin-users"])


@router.get("/users", response_model=PaginatedResponse[AdminUserResponse])
def list_users(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user=Depends(require_permission(PERM_ADMIN_USERS_READ)),
    db: Session = Depends(get_db),
):
    service = build_admin_service(db, include_audit_service=True)
    users, total = service.list_users_page(
        skip=pagination.offset,
        limit=pagination.limit,
        page=pagination.page,
        page_size=pagination.page_size,
        actor_user_id=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    items = [AdminUserResponse(**admin_user_to_dict(u)).model_dump(mode="json") for u in users]

    return build_paginated_response(
        items=items,
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )
