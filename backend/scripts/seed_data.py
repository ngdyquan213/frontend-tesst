from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.enums import TourScheduleStatus, TourStatus, TravelerType
from app.models.flight import Airline, Airport, Flight
from app.models.hotel import Hotel, HotelRoom
from app.models.tour import Tour, TourItinerary, TourPolicy, TourPriceRule, TourSchedule


def parse_anchor_datetime(value: str | None) -> datetime:
    if value:
        return datetime.fromisoformat(value)
    return datetime.now(timezone.utc)


def seed_airlines(db: Session) -> dict[str, Airline]:
    data = [
        {"code": "VN", "name": "Vietnam Airlines"},
        {"code": "VJ", "name": "VietJet Air"},
        {"code": "QH", "name": "Bamboo Airways"},
    ]
    result: dict[str, Airline] = {}
    for item in data:
        airline = db.query(Airline).filter(Airline.code == item["code"]).first()
        if not airline:
            airline = Airline(code=item["code"], name=item["name"])
            db.add(airline)
            db.flush()
        result[item["code"]] = airline
    return result


def seed_airports(db: Session) -> dict[str, Airport]:
    data = [
        {
            "code": "SGN",
            "name": "Tan Son Nhat International Airport",
            "city": "Ho Chi Minh City",
            "country": "Vietnam",
        },
        {
            "code": "HAN",
            "name": "Noi Bai International Airport",
            "city": "Ha Noi",
            "country": "Vietnam",
        },
        {
            "code": "DAD",
            "name": "Da Nang International Airport",
            "city": "Da Nang",
            "country": "Vietnam",
        },
    ]
    result: dict[str, Airport] = {}
    for item in data:
        airport = db.query(Airport).filter(Airport.code == item["code"]).first()
        if not airport:
            airport = Airport(
                code=item["code"],
                name=item["name"],
                city=item["city"],
                country=item["country"],
            )
            db.add(airport)
            db.flush()
        result[item["code"]] = airport
    return result


def seed_flights(
    db: Session,
    airlines: dict[str, Airline],
    airports: dict[str, Airport],
    *,
    anchor_datetime: datetime,
) -> None:
    data = [
        {
            "airline_code": "VN",
            "flight_number": "VN220",
            "departure_code": "SGN",
            "arrival_code": "HAN",
            "departure_time": anchor_datetime + timedelta(days=1, hours=2),
            "arrival_time": anchor_datetime + timedelta(days=1, hours=4),
            "base_price": Decimal("1850000.00"),
            "available_seats": 50,
            "status": "scheduled",
        },
        {
            "airline_code": "VJ",
            "flight_number": "VJ123",
            "departure_code": "HAN",
            "arrival_code": "DAD",
            "departure_time": anchor_datetime + timedelta(days=2, hours=1),
            "arrival_time": anchor_datetime + timedelta(days=2, hours=2, minutes=30),
            "base_price": Decimal("950000.00"),
            "available_seats": 60,
            "status": "scheduled",
        },
    ]

    for item in data:
        exists = db.query(Flight).filter(Flight.flight_number == item["flight_number"]).first()
        if exists:
            continue

        db.add(
            Flight(
                airline_id=airlines[item["airline_code"]].id,
                flight_number=item["flight_number"],
                departure_airport_id=airports[item["departure_code"]].id,
                arrival_airport_id=airports[item["arrival_code"]].id,
                departure_time=item["departure_time"],
                arrival_time=item["arrival_time"],
                base_price=item["base_price"],
                available_seats=item["available_seats"],
                status=item["status"],
            )
        )
    db.flush()


def seed_hotels(db: Session) -> dict[str, Hotel]:
    data = [
        {
            "name": "Liberty Central Saigon",
            "city": "Ho Chi Minh City",
            "country": "Vietnam",
            "star_rating": 4,
        },
        {"name": "Melia Hanoi", "city": "Ha Noi", "country": "Vietnam", "star_rating": 5},
    ]

    result: dict[str, Hotel] = {}
    for item in data:
        hotel = db.query(Hotel).filter(Hotel.name == item["name"]).first()
        if not hotel:
            hotel = Hotel(
                name=item["name"],
                city=item["city"],
                country=item["country"],
                star_rating=item["star_rating"],
                description=f"{item['name']} in {item['city']}",
            )
            db.add(hotel)
            db.flush()
        result[item["name"]] = hotel
    return result


def seed_hotel_rooms(db: Session, hotels: dict[str, Hotel]) -> None:
    data = [
        {
            "hotel_name": "Liberty Central Saigon",
            "room_type": "Deluxe",
            "capacity": 2,
            "price": Decimal("1200000.00"),
            "total_rooms": 20,
        },
        {
            "hotel_name": "Melia Hanoi",
            "room_type": "Premium",
            "capacity": 2,
            "price": Decimal("2500000.00"),
            "total_rooms": 15,
        },
    ]

    for item in data:
        hotel = hotels[item["hotel_name"]]
        exists = (
            db.query(HotelRoom)
            .filter(HotelRoom.hotel_id == hotel.id, HotelRoom.room_type == item["room_type"])
            .first()
        )
        if exists:
            continue

        db.add(
            HotelRoom(
                hotel_id=hotel.id,
                room_type=item["room_type"],
                capacity=item["capacity"],
                base_price_per_night=item["price"],
                total_rooms=item["total_rooms"],
            )
        )
    db.flush()


def seed_tours(db: Session) -> dict[str, Tour]:
    data = [
        {
            "code": "PQ-3N2D",
            "name": "Phu Quoc Discovery 3N2D",
            "destination": "Phu Quoc",
            "description": "Explore beaches, food, and islands in Phu Quoc.",
            "duration_days": 3,
            "duration_nights": 2,
            "meeting_point": "Tan Son Nhat Airport",
            "tour_type": "domestic",
            "status": TourStatus.active,
        },
        {
            "code": "DL-4N3D",
            "name": "Da Lat Escape 4N3D",
            "destination": "Da Lat",
            "description": "Nature and city experience in Da Lat.",
            "duration_days": 4,
            "duration_nights": 3,
            "meeting_point": "Ho Chi Minh City Center",
            "tour_type": "domestic",
            "status": TourStatus.active,
        },
    ]

    result: dict[str, Tour] = {}

    for item in data:
        tour = db.query(Tour).filter(Tour.code == item["code"]).first()
        if not tour:
            tour = Tour(**item)
            db.add(tour)
            db.flush()
        result[item["code"]] = tour

    return result


def seed_tour_details(db: Session, tours: dict[str, Tour]) -> None:
    pq = tours["PQ-3N2D"]
    dl = tours["DL-4N3D"]

    if not db.query(TourItinerary).filter(TourItinerary.tour_id == pq.id).first():
        db.add_all(
            [
                TourItinerary(
                    tour_id=pq.id,
                    day_number=1,
                    title="Arrival and check-in",
                    description="Airport transfer and hotel check-in.",
                ),
                TourItinerary(
                    tour_id=pq.id,
                    day_number=2,
                    title="Island hopping",
                    description="Boat trip and snorkeling.",
                ),
                TourItinerary(
                    tour_id=pq.id,
                    day_number=3,
                    title="Free time and departure",
                    description="Shopping and transfer.",
                ),
            ]
        )

    if not db.query(TourPolicy).filter(TourPolicy.tour_id == pq.id).first():
        db.add(
            TourPolicy(
                tour_id=pq.id,
                cancellation_policy="Free cancellation up to 7 days before departure.",
                refund_policy="50% refund within 3-6 days before departure.",
                notes="No refund within 48 hours.",
            )
        )

    if not db.query(TourItinerary).filter(TourItinerary.tour_id == dl.id).first():
        db.add_all(
            [
                TourItinerary(
                    tour_id=dl.id,
                    day_number=1,
                    title="City arrival",
                    description="Travel and evening market.",
                ),
                TourItinerary(
                    tour_id=dl.id,
                    day_number=2,
                    title="Nature sightseeing",
                    description="Pine forest and lake visits.",
                ),
                TourItinerary(
                    tour_id=dl.id,
                    day_number=3,
                    title="Adventure day",
                    description="Waterfall and mountain activities.",
                ),
                TourItinerary(
                    tour_id=dl.id,
                    day_number=4,
                    title="Return",
                    description="Breakfast and return transfer.",
                ),
            ]
        )

    if not db.query(TourPolicy).filter(TourPolicy.tour_id == dl.id).first():
        db.add(
            TourPolicy(
                tour_id=dl.id,
                cancellation_policy="Free cancellation up to 10 days before departure.",
                refund_policy="30% refund within 5-9 days before departure.",
                notes="No refund in the last 72 hours.",
            )
        )

    db.flush()


def seed_tour_schedules(
    db: Session,
    tours: dict[str, Tour],
    *,
    anchor_datetime: datetime,
) -> dict[str, TourSchedule]:
    today = anchor_datetime.date()
    data = [
        {
            "key": "PQ-S1",
            "tour_code": "PQ-3N2D",
            "departure_date": today + timedelta(days=7),
            "return_date": today + timedelta(days=9),
            "capacity": 20,
            "available_slots": 20,
            "status": TourScheduleStatus.scheduled,
        },
        {
            "key": "DL-S1",
            "tour_code": "DL-4N3D",
            "departure_date": today + timedelta(days=10),
            "return_date": today + timedelta(days=13),
            "capacity": 15,
            "available_slots": 15,
            "status": TourScheduleStatus.scheduled,
        },
    ]

    result: dict[str, TourSchedule] = {}

    for item in data:
        tour = tours[item["tour_code"]]
        schedule = (
            db.query(TourSchedule)
            .filter(
                TourSchedule.tour_id == tour.id,
                TourSchedule.departure_date == item["departure_date"],
            )
            .first()
        )
        if not schedule:
            schedule = TourSchedule(
                tour_id=tour.id,
                departure_date=item["departure_date"],
                return_date=item["return_date"],
                capacity=item["capacity"],
                available_slots=item["available_slots"],
                status=item["status"],
            )
            db.add(schedule)
            db.flush()

        result[item["key"]] = schedule

    return result


def seed_tour_price_rules(db: Session, schedules: dict[str, TourSchedule]) -> None:
    data = [
        {
            "schedule_key": "PQ-S1",
            "traveler_type": TravelerType.adult,
            "price": Decimal("3490000.00"),
        },
        {
            "schedule_key": "PQ-S1",
            "traveler_type": TravelerType.child,
            "price": Decimal("2490000.00"),
        },
        {
            "schedule_key": "PQ-S1",
            "traveler_type": TravelerType.infant,
            "price": Decimal("500000.00"),
        },
        {
            "schedule_key": "DL-S1",
            "traveler_type": TravelerType.adult,
            "price": Decimal("2890000.00"),
        },
        {
            "schedule_key": "DL-S1",
            "traveler_type": TravelerType.child,
            "price": Decimal("1990000.00"),
        },
        {
            "schedule_key": "DL-S1",
            "traveler_type": TravelerType.infant,
            "price": Decimal("400000.00"),
        },
    ]

    for item in data:
        schedule = schedules[item["schedule_key"]]
        exists = (
            db.query(TourPriceRule)
            .filter(
                TourPriceRule.tour_schedule_id == schedule.id,
                TourPriceRule.traveler_type == item["traveler_type"],
            )
            .first()
        )
        if exists:
            continue

        db.add(
            TourPriceRule(
                tour_schedule_id=schedule.id,
                traveler_type=item["traveler_type"],
                price=item["price"],
                currency="VND",
            )
        )

    db.flush()


def seed_catalog(db: Session, *, anchor_datetime: datetime) -> dict[str, dict[str, object]]:
    airlines = seed_airlines(db)
    airports = seed_airports(db)
    seed_flights(db, airlines, airports, anchor_datetime=anchor_datetime)

    hotels = seed_hotels(db)
    seed_hotel_rooms(db, hotels)

    tours = seed_tours(db)
    seed_tour_details(db, tours)
    schedules = seed_tour_schedules(db, tours, anchor_datetime=anchor_datetime)
    seed_tour_price_rules(db, schedules)

    return {
        "airlines": airlines,
        "airports": airports,
        "hotels": hotels,
        "tours": tours,
        "tour_schedules": schedules,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed catalog data.")
    parser.add_argument(
        "--anchor-datetime",
        help="Optional ISO-8601 datetime used to make generated dates deterministic.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    db = SessionLocal()
    try:
        with db.begin():
            seed_catalog(
                db,
                anchor_datetime=parse_anchor_datetime(args.anchor_datetime),
            )

        print("Seed data completed successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
