from sqlalchemy.orm import Session, joinedload

from app.models.booking import Booking, BookingItem, Traveler
from app.models.flight import Flight
from app.models.hotel import HotelRoom
from app.models.tour import TourSchedule


class BookingRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def add_booking(self, booking: Booking) -> Booking:
        self.db.add(booking)
        self.db.flush()
        return booking

    def add_booking_item(self, item: BookingItem) -> BookingItem:
        self.db.add(item)
        self.db.flush()
        return item

    def add_traveler(self, traveler: Traveler) -> Traveler:
        self.db.add(traveler)
        self.db.flush()
        return traveler

    def list_by_user_id(self, user_id: str, skip: int = 0, limit: int = 20) -> list[Booking]:
        return (
            self.db.query(Booking)
            .filter(Booking.user_id == user_id)
            .order_by(Booking.booked_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_user_id(self, user_id: str) -> int:
        return self.db.query(Booking).filter(Booking.user_id == user_id).count()

    def get_by_id(self, booking_id: str) -> Booking | None:
        return (
            self.db.query(Booking)
            .options(
                joinedload(Booking.items)
                .joinedload(BookingItem.flight)
                .joinedload(Flight.departure_airport),
                joinedload(Booking.items)
                .joinedload(BookingItem.flight)
                .joinedload(Flight.arrival_airport),
                joinedload(Booking.items)
                .joinedload(BookingItem.hotel_room)
                .joinedload(HotelRoom.hotel),
                joinedload(Booking.items)
                .joinedload(BookingItem.tour_schedule)
                .joinedload(TourSchedule.tour),
                joinedload(Booking.travelers),
                joinedload(Booking.user),
            )
            .filter(Booking.id == booking_id)
            .first()
        )

    def get_by_id_and_user_id(self, booking_id: str, user_id: str) -> Booking | None:
        return (
            self.db.query(Booking)
            .options(
                joinedload(Booking.items)
                .joinedload(BookingItem.flight)
                .joinedload(Flight.departure_airport),
                joinedload(Booking.items)
                .joinedload(BookingItem.flight)
                .joinedload(Flight.arrival_airport),
                joinedload(Booking.items)
                .joinedload(BookingItem.hotel_room)
                .joinedload(HotelRoom.hotel),
                joinedload(Booking.items)
                .joinedload(BookingItem.tour_schedule)
                .joinedload(TourSchedule.tour),
                joinedload(Booking.travelers),
                joinedload(Booking.user),
            )
            .filter(Booking.id == booking_id, Booking.user_id == user_id)
            .first()
        )

    def get_by_id_and_user_id_for_update(self, booking_id: str, user_id: str) -> Booking | None:
        return (
            self.db.query(Booking)
            .filter(Booking.id == booking_id, Booking.user_id == user_id)
            .with_for_update()
            .first()
        )

    def get_by_id_for_update(self, booking_id: str) -> Booking | None:
        return (
            self.db.query(Booking)
            .filter(Booking.id == booking_id)
            .with_for_update()
            .first()
        )

    def get_traveler_by_id_and_user_id(self, traveler_id: str, user_id: str) -> Traveler | None:
        return (
            self.db.query(Traveler)
            .join(Booking, Traveler.booking_id == Booking.id)
            .filter(
                Traveler.id == traveler_id,
                Booking.user_id == user_id,
            )
            .first()
        )

    def save(self, booking: Booking) -> Booking:
        self.db.add(booking)
        self.db.flush()
        return booking
