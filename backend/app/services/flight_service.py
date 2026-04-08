from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundAppException
from app.models.enums import LogActorType
from app.services.application_service import ApplicationService
from app.services.audit_service import AuditService


class FlightService(ApplicationService):
    def __init__(self, *, db: Session, flight_repo, audit_service: AuditService):
        self.db = db
        self.flight_repo = flight_repo
        self.audit_service = audit_service

    def list_flights(
        self,
        skip: int = 0,
        limit: int = 20,
        departure_airport_code: str | None = None,
        arrival_airport_code: str | None = None,
        status: str | None = None,
        sort_by: str = "departure_time",
        sort_order: str = "asc",
        page: int | None = None,
        page_size: int | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        flights = self.flight_repo.list_flights(
            skip=skip,
            limit=limit,
            departure_airport_code=departure_airport_code,
            arrival_airport_code=arrival_airport_code,
            status=status,
            sort_by=sort_by,
            sort_order=sort_order,
        )
        total = self.flight_repo.count_flights(
            departure_airport_code=departure_airport_code,
            arrival_airport_code=arrival_airport_code,
            status=status,
        )

        self.audit_service.log_action(
            actor_type=LogActorType.system,
            action="flights_list_viewed",
            resource_type="flight",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={
                "page": page,
                "page_size": page_size,
                "departure_airport_code": departure_airport_code,
                "arrival_airport_code": arrival_airport_code,
                "status": status,
                "sort_by": sort_by,
                "sort_order": sort_order,
                "result_count": len(flights),
            },
        )
        self.commit()

        return flights, total

    def get_flight(self, flight_id: str):
        flight = self.flight_repo.get_by_id(flight_id)
        if not flight:
            raise NotFoundAppException("Flight not found")
        return flight
