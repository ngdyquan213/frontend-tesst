from datetime import date

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.deps import build_hotel_service, get_pagination_params
from app.core.database import get_db
from app.core.exceptions import ValidationAppException
from app.schemas.common import PaginatedResponse
from app.schemas.hotel import HotelResponse
from app.utils.pagination import PaginationParams, build_paginated_response
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import hotel_to_dict

router = APIRouter(prefix="/hotels", tags=["hotels"])


def _validate_stay_dates(check_in_date: date | None, check_out_date: date | None) -> None:
    if (check_in_date is None) != (check_out_date is None):
        raise ValidationAppException("check_in_date and check_out_date must be provided together")
    if check_in_date and check_out_date and check_out_date <= check_in_date:
        raise ValidationAppException("check_out_date must be after check_in_date")


@router.get("", response_model=PaginatedResponse[HotelResponse])
def list_hotels(
    request: Request,
    pagination: PaginationParams = Depends(get_pagination_params),
    city: str | None = Query(default=None),
    country: str | None = Query(default=None),
    min_star_rating: int | None = Query(default=None, ge=1, le=5),
    sort_by: str = Query(default="name"),
    sort_order: str = Query(default="asc", pattern="^(asc|desc)$"),
    check_in_date: date | None = Query(default=None),
    check_out_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    _validate_stay_dates(check_in_date, check_out_date)

    service = build_hotel_service(db)
    hotels, availability_map, total = service.list_hotels(
        skip=pagination.offset,
        limit=pagination.limit,
        city=city,
        country=country,
        min_star_rating=min_star_rating,
        sort_by=sort_by,
        sort_order=sort_order,
        check_in_date=check_in_date,
        check_out_date=check_out_date,
        page=pagination.page,
        page_size=pagination.page_size,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    items = [
        HotelResponse(**hotel_to_dict(hotel, availability_map=availability_map)).model_dump(
            mode="json"
        )
        for hotel in hotels
    ]

    return build_paginated_response(
        items=items,
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )


@router.get("/{hotel_id}", response_model=HotelResponse)
def get_hotel(
    hotel_id: str,
    check_in_date: date | None = Query(default=None),
    check_out_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> HotelResponse:
    _validate_stay_dates(check_in_date, check_out_date)

    service = build_hotel_service(db)

    hotel, availability_map = service.get_hotel(
        hotel_id,
        check_in_date=check_in_date,
        check_out_date=check_out_date,
    )

    return HotelResponse(**hotel_to_dict(hotel, availability_map=availability_map))
