from sqlalchemy import asc, desc
from sqlalchemy.orm import Session, joinedload

from app.models.flight import Flight


class FlightRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_flights(
        self,
        skip: int = 0,
        limit: int = 20,
        departure_airport_code: str | None = None,
        arrival_airport_code: str | None = None,
        status: str | None = None,
        sort_by: str = "departure_time",
        sort_order: str = "asc",
    ) -> list[Flight]:
        query = self.db.query(Flight).options(
            joinedload(Flight.airline),
            joinedload(Flight.departure_airport),
            joinedload(Flight.arrival_airport),
        )

        if departure_airport_code:
            query = query.join(Flight.departure_airport).filter(
                Flight.departure_airport.has(code=departure_airport_code.upper())
            )

        if arrival_airport_code:
            query = query.filter(Flight.arrival_airport.has(code=arrival_airport_code.upper()))

        if status:
            query = query.filter(Flight.status == status)

        sort_column = {
            "departure_time": Flight.departure_time,
            "arrival_time": Flight.arrival_time,
            "base_price": Flight.base_price,
            "available_seats": Flight.available_seats,
        }.get(sort_by, Flight.departure_time)

        order_clause = asc(sort_column) if sort_order == "asc" else desc(sort_column)

        return query.order_by(order_clause).offset(skip).limit(limit).all()

    def count_flights(
        self,
        departure_airport_code: str | None = None,
        arrival_airport_code: str | None = None,
        status: str | None = None,
    ) -> int:
        query = self.db.query(Flight)

        if departure_airport_code:
            query = query.filter(Flight.departure_airport.has(code=departure_airport_code.upper()))

        if arrival_airport_code:
            query = query.filter(Flight.arrival_airport.has(code=arrival_airport_code.upper()))

        if status:
            query = query.filter(Flight.status == status)

        return query.count()

    def get_by_id(self, flight_id: str) -> Flight | None:
        return (
            self.db.query(Flight)
            .options(
                joinedload(Flight.airline),
                joinedload(Flight.departure_airport),
                joinedload(Flight.arrival_airport),
            )
            .filter(Flight.id == flight_id)
            .first()
        )

    def get_by_id_for_update(self, flight_id: str) -> Flight | None:
        return self.db.query(Flight).filter(Flight.id == flight_id).with_for_update().first()

    def save(self, flight: Flight) -> Flight:
        self.db.add(flight)
        self.db.flush()
        return flight
