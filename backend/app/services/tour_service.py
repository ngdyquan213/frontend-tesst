from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundAppException
from app.models.enums import LogActorType, TourStatus
from app.services.application_service import ApplicationService
from app.services.audit_service import AuditService


class TourService(ApplicationService):
    def __init__(self, *, db: Session, tour_repo, audit_service: AuditService):
        self.db = db
        self.tour_repo = tour_repo
        self.audit_service = audit_service

    def list_tours(
        self,
        skip: int = 0,
        limit: int = 20,
        destination: str | None = None,
        status: TourStatus | None = None,
        tour_type: str | None = None,
        sort_by: str = "name",
        sort_order: str = "asc",
        page: int | None = None,
        page_size: int | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        tours = self.tour_repo.list_tours(
            skip=skip,
            limit=limit,
            destination=destination,
            status=status,
            tour_type=tour_type,
            sort_by=sort_by,
            sort_order=sort_order,
        )
        total = self.tour_repo.count_tours(
            destination=destination,
            status=status,
            tour_type=tour_type,
        )

        self.audit_service.log_action(
            actor_type=LogActorType.system,
            action="tours_list_viewed",
            resource_type="tour",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={
                "page": page,
                "page_size": page_size,
                "destination": destination,
                "status": status,
                "tour_type": tour_type,
                "sort_by": sort_by,
                "sort_order": sort_order,
                "result_count": len(tours),
            },
        )
        self.commit()

        return tours, total

    def get_tour(self, tour_id: str):
        tour = self.tour_repo.get_by_id(tour_id)
        if not tour:
            raise NotFoundAppException("Tour not found")
        return tour

    def get_tour_with_audit(
        self,
        *,
        tour_id: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        tour = self.get_tour(tour_id)

        self.audit_service.log_action(
            actor_type=LogActorType.system,
            action="tour_detail_viewed",
            resource_type="tour",
            resource_id=tour.id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"tour_id": str(tour.id)},
        )
        self.commit()

        return tour
