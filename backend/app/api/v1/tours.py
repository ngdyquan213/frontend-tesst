from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.deps import build_tour_service, get_pagination_params
from app.core.database import get_db
from app.models.enums import TourStatus
from app.schemas.common import PaginatedResponse
from app.schemas.tour import (
    TourResponse,
)
from app.utils.pagination import PaginationParams, build_paginated_response
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import tour_to_dict

router = APIRouter(prefix="/tours", tags=["tours"])


@router.get("", response_model=PaginatedResponse[TourResponse])
def list_tours(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination_params),
    destination: str | None = Query(default=None),
    status: TourStatus | None = Query(default=None),
    tour_type: str | None = Query(default=None),
    sort_by: str = Query(default="name"),
    sort_order: str = Query(default="asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    service = build_tour_service(db)
    tours, total = service.list_tours(
        skip=pagination.offset,
        limit=pagination.limit,
        destination=destination,
        status=status,
        tour_type=tour_type,
        sort_by=sort_by,
        sort_order=sort_order,
        page=pagination.page,
        page_size=pagination.page_size,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    items = [TourResponse(**tour_to_dict(t)).model_dump(mode="json") for t in tours]

    return build_paginated_response(
        items=items,
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )


@router.get("/{tour_id}", response_model=TourResponse)
def get_tour(
    tour_id: str,
    request: Request,
    db: Session = Depends(get_db),
) -> TourResponse:
    service = build_tour_service(db)
    tour = service.get_tour_with_audit(
        tour_id=tour_id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return TourResponse(**tour_to_dict(tour))
