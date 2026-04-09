from decimal import Decimal

from sqlalchemy import and_, asc, desc, or_
from sqlalchemy.orm import Session, joinedload

from app.models.enums import TourStatus
from app.models.tour import Tour, TourPriceRule, TourSchedule


class TourRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    @staticmethod
    def _apply_catalog_filters(
        query,
        *,
        destination: str | None = None,
        duration: str | None = None,
        group_size: str | None = None,
        price_range: str | None = None,
        status: TourStatus | None = None,
        tour_type: str | None = None,
    ):
        if destination:
            keyword = f"%{destination}%"
            query = query.filter(
                or_(
                    Tour.destination.ilike(keyword),
                    Tour.name.ilike(keyword),
                    Tour.description.ilike(keyword),
                )
            )

        if duration == "short":
            query = query.filter(Tour.duration_days <= 5)
        elif duration == "medium":
            query = query.filter(Tour.duration_days >= 6, Tour.duration_days <= 9)
        elif duration == "long":
            query = query.filter(Tour.duration_days >= 10)

        if group_size == "intimate":
            query = query.filter(Tour.schedules.any(TourSchedule.capacity <= 8))
        elif group_size == "shared":
            query = query.filter(
                Tour.schedules.any(
                    and_(
                        TourSchedule.capacity >= 9,
                        TourSchedule.capacity <= 12,
                    )
                )
            )
        elif group_size == "large":
            query = query.filter(Tour.schedules.any(TourSchedule.capacity >= 13))

        if price_range == "under-1500":
            query = query.filter(
                Tour.schedules.any(
                    TourSchedule.price_rules.any(TourPriceRule.price < Decimal("1500"))
                )
            )
        elif price_range == "1500-2500":
            query = query.filter(
                Tour.schedules.any(
                    TourSchedule.price_rules.any(
                        and_(
                            TourPriceRule.price >= Decimal("1500"),
                            TourPriceRule.price <= Decimal("2500"),
                        )
                    )
                )
            )
        elif price_range == "2500-plus":
            query = query.filter(
                Tour.schedules.any(
                    TourSchedule.price_rules.any(TourPriceRule.price > Decimal("2500"))
                )
            )

        if status:
            query = query.filter(Tour.status == status)

        if tour_type:
            query = query.filter(Tour.tour_type == tour_type)

        return query

    def list_tours(
        self,
        skip: int = 0,
        limit: int = 20,
        destination: str | None = None,
        duration: str | None = None,
        group_size: str | None = None,
        price_range: str | None = None,
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
        query = self._apply_catalog_filters(
            query,
            destination=destination,
            duration=duration,
            group_size=group_size,
            price_range=price_range,
            status=status,
            tour_type=tour_type,
        )

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
        duration: str | None = None,
        group_size: str | None = None,
        price_range: str | None = None,
        status: TourStatus | None = None,
        tour_type: str | None = None,
    ) -> int:
        query = self.db.query(Tour)
        query = self._apply_catalog_filters(
            query,
            destination=destination,
            duration=duration,
            group_size=group_size,
            price_range=price_range,
            status=status,
            tour_type=tour_type,
        )

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

    def list_active_tours_for_catalog(self) -> list[Tour]:
        return (
            self.db.query(Tour)
            .options(
                joinedload(Tour.schedules).joinedload(TourSchedule.price_rules),
            )
            .filter(Tour.status == TourStatus.active)
            .all()
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
