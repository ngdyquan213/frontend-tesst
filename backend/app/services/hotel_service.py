from datetime import date

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundAppException
from app.models.enums import LogActorType
from app.services.application_service import ApplicationService
from app.services.audit_service import AuditService


class HotelService(ApplicationService):
    def __init__(self, *, db: Session, hotel_repo, audit_service: AuditService):
        self.db = db
        self.hotel_repo = hotel_repo
        self.audit_service = audit_service

    def list_hotels(
        self,
        skip: int = 0,
        limit: int = 20,
        city: str | None = None,
        country: str | None = None,
        min_star_rating: int | None = None,
        sort_by: str = "name",
        sort_order: str = "asc",
        check_in_date: date | None = None,
        check_out_date: date | None = None,
        page: int | None = None,
        page_size: int | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        hotels = self.hotel_repo.list_hotels(
            skip=skip,
            limit=limit,
            city=city,
            country=country,
            min_star_rating=min_star_rating,
            sort_by=sort_by,
            sort_order=sort_order,
        )
        availability_map = None
        if check_in_date and check_out_date:
            rooms = [room for hotel in hotels for room in hotel.rooms]
            availability_map = self.hotel_repo.build_room_availability_map(
                rooms=rooms,
                check_in_date=check_in_date,
                check_out_date=check_out_date,
            )
        total = self.hotel_repo.count_hotels(
            city=city,
            country=country,
            min_star_rating=min_star_rating,
        )

        self.audit_service.log_action(
            actor_type=LogActorType.system,
            action="hotels_list_viewed",
            resource_type="hotel",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={
                "page": page,
                "page_size": page_size,
                "city": city,
                "country": country,
                "min_star_rating": min_star_rating,
                "sort_by": sort_by,
                "sort_order": sort_order,
                "check_in_date": check_in_date.isoformat() if check_in_date else None,
                "check_out_date": check_out_date.isoformat() if check_out_date else None,
                "result_count": len(hotels),
            },
        )
        self.commit()

        return hotels, availability_map, total

    def get_hotel(
        self,
        hotel_id: str,
        *,
        check_in_date: date | None = None,
        check_out_date: date | None = None,
    ):
        hotel = self.hotel_repo.get_by_id(hotel_id)
        if not hotel:
            raise NotFoundAppException("Hotel not found")
        availability_map = None
        if check_in_date and check_out_date:
            availability_map = self.hotel_repo.build_room_availability_map(
                rooms=hotel.rooms,
                check_in_date=check_in_date,
                check_out_date=check_out_date,
            )
        return hotel, availability_map
