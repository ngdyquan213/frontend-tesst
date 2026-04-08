from sqlalchemy import asc, desc
from sqlalchemy.orm import Session, joinedload

from app.models.enums import TourStatus
from app.models.tour import Tour, TourPriceRule, TourSchedule


class TourRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_tours(
        self,
        skip: int = 0,
        limit: int = 20,
        destination: str | None = None,
        status: TourStatus | None = None,
        tour_type: str | None = None,
        sort_by: str = "name",
        sort_order: str = "asc",
    ) -> list[Tour]:
        query = self.db.query(Tour).options(
            joinedload(Tour.schedules).joinedload(TourSchedule.price_rules),
            joinedload(Tour.itineraries),
            joinedload(Tour.policies),
        )

        if destination:
            query = query.filter(Tour.destination.ilike(f"%{destination}%"))

        if status:
            query = query.filter(Tour.status == status)

        if tour_type:
            query = query.filter(Tour.tour_type == tour_type)

        sort_column = {
            "name": Tour.name,
            "destination": Tour.destination,
            "duration_days": Tour.duration_days,
        }.get(sort_by, Tour.name)

        order_clause = asc(sort_column) if sort_order == "asc" else desc(sort_column)

        return query.order_by(order_clause).offset(skip).limit(limit).all()

    def count_tours(
        self,
        destination: str | None = None,
        status: TourStatus | None = None,
        tour_type: str | None = None,
    ) -> int:
        query = self.db.query(Tour)

        if destination:
            query = query.filter(Tour.destination.ilike(f"%{destination}%"))

        if status:
            query = query.filter(Tour.status == status)

        if tour_type:
            query = query.filter(Tour.tour_type == tour_type)

        return query.count()

    def get_by_id(self, tour_id: str) -> Tour | None:
        return (
            self.db.query(Tour)
            .options(
                joinedload(Tour.schedules).joinedload(TourSchedule.price_rules),
                joinedload(Tour.itineraries),
                joinedload(Tour.policies),
            )
            .filter(Tour.id == tour_id)
            .first()
        )

    def get_by_code(self, code: str) -> Tour | None:
        return self.db.query(Tour).filter(Tour.code == code).first()

    def add_tour(self, tour: Tour) -> Tour:
        self.db.add(tour)
        self.db.flush()
        return tour

    def save_tour(self, tour: Tour) -> Tour:
        self.db.add(tour)
        self.db.flush()
        return tour

    def add_schedule(self, schedule: TourSchedule) -> TourSchedule:
        self.db.add(schedule)
        self.db.flush()
        return schedule

    def save_schedule(self, schedule: TourSchedule) -> TourSchedule:
        self.db.add(schedule)
        self.db.flush()
        return schedule

    def get_schedule_by_id(self, schedule_id: str) -> TourSchedule | None:
        return (
            self.db.query(TourSchedule)
            .options(joinedload(TourSchedule.price_rules), joinedload(TourSchedule.tour))
            .filter(TourSchedule.id == schedule_id)
            .first()
        )

    def get_schedule_by_id_for_update(self, schedule_id: str) -> TourSchedule | None:
        return (
            self.db.query(TourSchedule)
            .filter(TourSchedule.id == schedule_id)
            .with_for_update()
            .first()
        )

    def list_schedules_by_tour_id(self, tour_id: str) -> list[TourSchedule]:
        return (
            self.db.query(TourSchedule)
            .options(joinedload(TourSchedule.price_rules))
            .filter(TourSchedule.tour_id == tour_id)
            .order_by(TourSchedule.departure_date.asc())
            .all()
        )

    def add_price_rule(self, rule: TourPriceRule) -> TourPriceRule:
        self.db.add(rule)
        self.db.flush()
        return rule
