from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import (
    build_support_service,
    get_current_user,
    get_pagination_params,
    require_permission,
)
from app.core.constants import PERM_ADMIN_SUPPORT_READ, PERM_ADMIN_SUPPORT_WRITE
from app.core.database import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.support import (
    AdminSupportTicketUpdateRequest,
    CreateSupportTicketRequest,
    SupportTicketDetailResponse,
    SupportTicketReplyCreateRequest,
    SupportTicketResponse,
)
from app.utils.pagination import PaginationParams, build_paginated_response
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import (
    support_ticket_to_detail_dict,
    support_ticket_to_dict,
)

router = APIRouter(prefix="/support", tags=["support"])


@router.post("/tickets", response_model=SupportTicketResponse, status_code=status.HTTP_201_CREATED)
def create_support_ticket(
    payload: CreateSupportTicketRequest,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SupportTicketResponse:
    service = build_support_service(db)
    ticket = service.create_ticket(
        user_id=str(current_user.id),
        authenticated_email=current_user.email,
        authenticated_full_name=current_user.full_name,
        payload=payload,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    return SupportTicketResponse(**support_ticket_to_dict(ticket))


@router.get("/tickets", response_model=PaginatedResponse[SupportTicketResponse])
def list_my_support_tickets(
    current_user=Depends(get_current_user),
    pagination: PaginationParams = Depends(get_pagination_params),
    db: Session = Depends(get_db),
):
    service = build_support_service(db)
    tickets = service.list_tickets_for_user(
        user_id=str(current_user.id),
        skip=pagination.offset,
        limit=pagination.limit,
    )
    total = service.count_tickets_for_user(user_id=str(current_user.id))
    items = [support_ticket_to_dict(ticket) for ticket in tickets]
    return build_paginated_response(
        items=items,
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )


@router.get("/tickets/{ticket_id}", response_model=SupportTicketDetailResponse)
def get_my_support_ticket(
    ticket_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SupportTicketDetailResponse:
    service = build_support_service(db)
    ticket = service.get_ticket_for_user(ticket_id=ticket_id, user_id=str(current_user.id))
    return SupportTicketDetailResponse(**support_ticket_to_detail_dict(ticket))


@router.post("/tickets/{ticket_id}/replies", response_model=SupportTicketDetailResponse)
def reply_to_my_support_ticket(
    ticket_id: str,
    payload: SupportTicketReplyCreateRequest,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SupportTicketDetailResponse:
    service = build_support_service(db)
    ticket = service.add_user_reply(
        ticket_id=ticket_id,
        user_id=str(current_user.id),
        author_name=current_user.full_name,
        message=payload.message,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    return SupportTicketDetailResponse(**support_ticket_to_detail_dict(ticket))


@router.get("/admin/tickets", response_model=PaginatedResponse[SupportTicketResponse])
def list_admin_support_tickets(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination_params),
    status: str | None = Query(default=None),
    current_user=Depends(require_permission(PERM_ADMIN_SUPPORT_READ)),
    db: Session = Depends(get_db),
):
    service = build_support_service(db)
    tickets = service.list_tickets_for_admin(
        skip=pagination.offset,
        limit=pagination.limit,
        status=status,
    )
    total = service.count_tickets_for_admin(status=status)
    items = [support_ticket_to_dict(ticket) for ticket in tickets]
    return build_paginated_response(
        items=items,
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )


@router.get("/admin/tickets/{ticket_id}", response_model=SupportTicketDetailResponse)
def get_admin_support_ticket(
    ticket_id: str,
    current_user=Depends(require_permission(PERM_ADMIN_SUPPORT_READ)),
    db: Session = Depends(get_db),
) -> SupportTicketDetailResponse:
    service = build_support_service(db)
    ticket = service.get_ticket_for_admin(ticket_id=ticket_id)
    return SupportTicketDetailResponse(**support_ticket_to_detail_dict(ticket))


@router.post("/admin/tickets/{ticket_id}/replies", response_model=SupportTicketDetailResponse)
def reply_to_support_ticket_as_admin(
    ticket_id: str,
    payload: SupportTicketReplyCreateRequest,
    request: Request,
    current_user=Depends(require_permission(PERM_ADMIN_SUPPORT_WRITE)),
    db: Session = Depends(get_db),
) -> SupportTicketDetailResponse:
    service = build_support_service(db)
    ticket = service.add_admin_reply(
        ticket_id=ticket_id,
        admin_user_id=str(current_user.id),
        author_name=current_user.full_name,
        message=payload.message,
        status=payload.status,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    return SupportTicketDetailResponse(**support_ticket_to_detail_dict(ticket))


@router.put("/admin/tickets/{ticket_id}", response_model=SupportTicketDetailResponse)
def update_support_ticket_as_admin(
    ticket_id: str,
    payload: AdminSupportTicketUpdateRequest,
    request: Request,
    current_user=Depends(require_permission(PERM_ADMIN_SUPPORT_WRITE)),
    db: Session = Depends(get_db),
) -> SupportTicketDetailResponse:
    service = build_support_service(db)
    ticket = service.update_ticket_status_for_admin(
        ticket_id=ticket_id,
        admin_user_id=str(current_user.id),
        status=payload.status,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    return SupportTicketDetailResponse(**support_ticket_to_detail_dict(ticket))
