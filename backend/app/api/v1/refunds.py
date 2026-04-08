from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.deps import build_payment_service, get_current_user, get_pagination_params
from app.core.database import get_db
from app.core.exceptions import NotFoundAppException
from app.repositories.payment_repository import PaymentRepository
from app.schemas.common import PaginatedResponse
from app.schemas.refund import RefundCreateRequest, RefundResponse
from app.utils.pagination import PaginationParams, build_paginated_response
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import refund_to_dict

router = APIRouter(prefix="/refunds", tags=["refunds"])


@router.post("", response_model=RefundResponse, status_code=status.HTTP_201_CREATED)
def create_my_refund(
    payload: RefundCreateRequest,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = build_payment_service(db)
    refund = service.create_refund_request(
        booking_id=payload.booking_id,
        user_id=str(current_user.id),
        reason=payload.reason,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    return RefundResponse(**refund_to_dict(refund))


@router.get("", response_model=PaginatedResponse[RefundResponse])
def list_my_refunds(
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = PaymentRepository(db)
    refunds = repo.list_refunds_for_user(
        user_id=str(current_user.id),
        skip=pagination.offset,
        limit=pagination.limit,
    )
    total = repo.count_refunds_for_user(user_id=str(current_user.id))

    items = [
        RefundResponse(**refund_to_dict(refund)).model_dump(mode="json") for refund in refunds
    ]

    return build_paginated_response(
        items=items,
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )


@router.get("/{refund_id}", response_model=RefundResponse)
def get_my_refund(
    refund_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = PaymentRepository(db)
    owned_refund = repo.get_refund_by_id_for_user(
        refund_id=refund_id,
        user_id=str(current_user.id),
    )
    if not owned_refund:
        raise NotFoundAppException("Refund not found")

    return RefundResponse(**refund_to_dict(owned_refund))
