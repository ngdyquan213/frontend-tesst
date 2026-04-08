from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.deps import build_traveler_service, get_current_user
from app.core.database import get_db
from app.schemas.traveler import TravelerCreateRequest, TravelerResponse
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import traveler_to_dict

router = APIRouter(prefix="/bookings", tags=["booking-travelers"])


@router.get("/{booking_id}/travelers", response_model=list[TravelerResponse])
def list_booking_travelers(
    booking_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TravelerResponse]:
    service = build_traveler_service(db)

    travelers = service.list_travelers(
        booking_id=booking_id,
        user_id=str(current_user.id),
    )

    return [TravelerResponse(**traveler_to_dict(t)) for t in travelers]


@router.post(
    "/{booking_id}/travelers", response_model=TravelerResponse, status_code=status.HTTP_201_CREATED
)
def add_booking_traveler(
    booking_id: str,
    payload: TravelerCreateRequest,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TravelerResponse:
    service = build_traveler_service(db)

    traveler = service.add_traveler(
        booking_id=booking_id,
        user_id=str(current_user.id),
        payload=payload,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return TravelerResponse(**traveler_to_dict(traveler))
