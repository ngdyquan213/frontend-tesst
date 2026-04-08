from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import (
    build_booking_service,
    build_hotel_booking_service,
    build_tour_booking_service,
    get_current_user,
    get_pagination_params,
)
from app.core.database import get_db
from app.core.exceptions import AppException
from app.schemas.booking import (
    BookingCreateRequest,
    BookingResponse,
    HotelBookingCreateRequest,
    TourBookingCreateRequest,
)
from app.schemas.common import PaginatedResponse
from app.utils.pagination import PaginationParams, build_paginated_response
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import booking_to_dict

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreateRequest,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BookingResponse:
    service = build_booking_service(db)

    try:
        booking = service.create_booking(
            user_id=str(current_user.id),
            payload=payload,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
        )
    except AppException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Internal server error") from exc

    return BookingResponse(**booking_to_dict(booking))


@router.post("/hotels", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_hotel_booking(
    payload: HotelBookingCreateRequest,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BookingResponse:
    service = build_hotel_booking_service(db)

    try:
        booking = service.create_hotel_booking(
            user_id=str(current_user.id),
            payload=payload,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
        )
    except AppException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Internal server error") from exc

    return BookingResponse(**booking_to_dict(booking))


@router.post("/tours", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_tour_booking(
    payload: TourBookingCreateRequest,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BookingResponse:
    service = build_tour_booking_service(db)

    try:
        booking = service.create_tour_booking(
            user_id=str(current_user.id),
            user_email=current_user.email,
            user_full_name=current_user.full_name,
            payload=payload,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
        )
    except AppException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Internal server error") from exc

    return BookingResponse(**booking_to_dict(booking))


@router.get("", response_model=PaginatedResponse[BookingResponse])
def list_my_bookings(
    current_user=Depends(get_current_user),
    pagination: PaginationParams = Depends(get_pagination_params),
    db: Session = Depends(get_db),
):
    service = build_booking_service(db)

    total = service.count_my_bookings(str(current_user.id))
    bookings = service.list_my_bookings(
        str(current_user.id),
        skip=pagination.offset,
        limit=pagination.limit,
    )
    items = [booking_to_dict(b) for b in bookings]

    return build_paginated_response(
        items=items,
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )
