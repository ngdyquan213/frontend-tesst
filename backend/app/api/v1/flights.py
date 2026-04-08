from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.deps import build_flight_service, get_pagination_params
from app.core.database import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.flight import FlightResponse
from app.utils.pagination import PaginationParams, build_paginated_response
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import flight_to_dict

router = APIRouter(prefix="/flights", tags=["flights"])


@router.get("", response_model=PaginatedResponse[FlightResponse])
def list_flights(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination_params),
    departure_airport_code: str | None = Query(default=None),
    arrival_airport_code: str | None = Query(default=None),
    status: str | None = Query(default=None),
    sort_by: str = Query(default="departure_time"),
    sort_order: str = Query(default="asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    service = build_flight_service(db)
    flights, total = service.list_flights(
        skip=pagination.offset,
        limit=pagination.limit,
        departure_airport_code=departure_airport_code,
        arrival_airport_code=arrival_airport_code,
        status=status,
        sort_by=sort_by,
        sort_order=sort_order,
        page=pagination.page,
        page_size=pagination.page_size,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    items = [FlightResponse(**flight_to_dict(f)).model_dump(mode="json") for f in flights]

    return build_paginated_response(
        items=items,
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )


@router.get("/{flight_id}", response_model=FlightResponse)
def get_flight(
    flight_id: str,
    db: Session = Depends(get_db),
) -> FlightResponse:
    service = build_flight_service(db)

    flight = service.get_flight(flight_id)

    return FlightResponse(**flight_to_dict(flight))
