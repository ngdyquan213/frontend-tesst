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
        {
            "code": "AMALFI-6N5D",
            "name": "Amalfi Coast Escape 6N5D",
            "destination": "Amalfi Coast",
            "description": "Curated coastline itinerary with premium departures across Amalfi villages and seaside towns.",
            "duration_days": 6,
            "duration_nights": 5,
            "meeting_point": "Naples International Airport",
            "tour_type": "international",
            "status": TourStatus.active,
        },
        {
            "code": "CT-5N4D",
            "name": "Cinque Terre Trail 5N4D",
            "destination": "Cinque Terre",
            "description": "Harbor villages, scenic coastal walks, and relaxed Ligurian pacing.",
            "duration_days": 5,
            "duration_nights": 4,
            "meeting_point": "Pisa Centrale",
            "tour_type": "international",
            "status": TourStatus.active,
        },
        {
            "code": "ICE-7N6D",
            "name": "Iceland Ring Highlights 7N6D",
            "destination": "Iceland",
            "description": "Waterfalls, lava fields, geothermal stops, and weather-smart escorted logistics.",
            "duration_days": 7,
            "duration_nights": 6,
            "meeting_point": "Keflavik International Airport",
            "tour_type": "international",
            "status": TourStatus.active,
        },
        {
            "code": "BALTIC-6N5D",
            "name": "Baltic Capitals Discovery 6N5D",
            "destination": "Baltic Capitals",
            "description": "A polished city circuit across Tallinn, Riga, and Vilnius.",
            "duration_days": 6,
            "duration_nights": 5,
            "meeting_point": "Tallinn Airport",
            "tour_type": "international",
            "status": TourStatus.active,
        },
        {
            "code": "KYOTO-4N3D",
            "name": "Kyoto Heritage Stay 4N3D",
            "destination": "Kyoto",
            "description": "Temple districts, heritage lanes, and gently paced cultural mornings.",
            "duration_days": 4,
            "duration_nights": 3,
            "meeting_point": "Kyoto Station",
            "tour_type": "international",
            "status": TourStatus.active,
        },
        {
            "code": "BALI-5N4D",
            "name": "Bali Wellness Retreat 5N4D",
            "destination": "Bali",
            "description": "Rice terraces, wellness rituals, and resort-paced cultural discovery.",
            "duration_days": 5,
            "duration_nights": 4,
            "meeting_point": "Ngurah Rai International Airport",
            "tour_type": "international",
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
    amalfi = tours["AMALFI-6N5D"]
    cinque_terre = tours["CT-5N4D"]
    iceland = tours["ICE-7N6D"]
    baltic = tours["BALTIC-6N5D"]
    kyoto = tours["KYOTO-4N3D"]
    bali = tours["BALI-5N4D"]

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

    if not db.query(TourItinerary).filter(TourItinerary.tour_id == amalfi.id).first():
        db.add_all(
            [
                TourItinerary(
                    tour_id=amalfi.id,
                    day_number=1,
                    title="Arrival in Naples",
                    description="Airport pickup, transfer to the coast, and welcome dinner.",
                ),
                TourItinerary(
                    tour_id=amalfi.id,
                    day_number=2,
                    title="Cliffside towns",
                    description="Guided time through Positano and Amalfi with terrace viewpoints.",
                ),
            ]
        )

    if not db.query(TourPolicy).filter(TourPolicy.tour_id == amalfi.id).first():
        db.add(
            TourPolicy(
                tour_id=amalfi.id,
                cancellation_policy="Free cancellation up to 21 days before departure.",
                refund_policy="60% refund within 8-20 days before departure.",
                notes="No refund within 7 days of departure.",
            )
        )

    if not db.query(TourItinerary).filter(TourItinerary.tour_id == cinque_terre.id).first():
        db.add_all(
            [
                TourItinerary(
                    tour_id=cinque_terre.id,
                    day_number=1,
                    title="Arrival in Liguria",
                    description="Hotel check-in and harbor orientation walk.",
                ),
                TourItinerary(
                    tour_id=cinque_terre.id,
                    day_number=2,
                    title="Village trail day",
                    description="Coastal trail segments and local tasting stops.",
                ),
            ]
        )

    if not db.query(TourPolicy).filter(TourPolicy.tour_id == cinque_terre.id).first():
        db.add(
            TourPolicy(
                tour_id=cinque_terre.id,
                cancellation_policy="Free cancellation up to 18 days before departure.",
                refund_policy="50% refund within 7-17 days before departure.",
                notes="Weather-dependent route adjustments may apply.",
            )
        )

    if not db.query(TourItinerary).filter(TourItinerary.tour_id == iceland.id).first():
        db.add_all(
            [
                TourItinerary(
                    tour_id=iceland.id,
                    day_number=1,
                    title="Arrival and Reykjavik briefing",
                    description="Transfer, city orientation, and evening operations briefing.",
                ),
                TourItinerary(
                    tour_id=iceland.id,
                    day_number=2,
                    title="South coast circuit",
                    description="Waterfalls, black-sand beaches, and glacier viewpoints.",
                ),
            ]
        )

    if not db.query(TourPolicy).filter(TourPolicy.tour_id == iceland.id).first():
        db.add(
            TourPolicy(
                tour_id=iceland.id,
                cancellation_policy="Free cancellation up to 25 days before departure.",
                refund_policy="65% refund within 10-24 days before departure.",
                notes="Road and weather changes are handled by on-trip operations.",
            )
        )

    if not db.query(TourItinerary).filter(TourItinerary.tour_id == baltic.id).first():
        db.add_all(
            [
                TourItinerary(
                    tour_id=baltic.id,
                    day_number=1,
                    title="Tallinn arrival",
                    description="Transfer, old-town walk, and welcome briefing.",
                ),
                TourItinerary(
                    tour_id=baltic.id,
                    day_number=2,
                    title="Capital-to-capital transfer",
                    description="Scenic coach transfer with curated city stops.",
                ),
            ]
        )

    if not db.query(TourPolicy).filter(TourPolicy.tour_id == baltic.id).first():
        db.add(
            TourPolicy(
                tour_id=baltic.id,
                cancellation_policy="Free cancellation up to 20 days before departure.",
                refund_policy="55% refund within 8-19 days before departure.",
                notes="Cross-border timing may shift with local event controls.",
            )
        )

    if not db.query(TourItinerary).filter(TourItinerary.tour_id == kyoto.id).first():
        db.add_all(
            [
                TourItinerary(
                    tour_id=kyoto.id,
                    day_number=1,
                    title="Heritage arrival",
                    description="Station meet-up, ryokan check-in, and evening neighborhood stroll.",
                ),
                TourItinerary(
                    tour_id=kyoto.id,
                    day_number=2,
                    title="Temple morning",
                    description="Guided temple district route and tea experience.",
                ),
            ]
        )

    if not db.query(TourPolicy).filter(TourPolicy.tour_id == kyoto.id).first():
        db.add(
            TourPolicy(
                tour_id=kyoto.id,
                cancellation_policy="Free cancellation up to 16 days before departure.",
                refund_policy="45% refund within 6-15 days before departure.",
                notes="Peak blossom and foliage periods may have stricter hotel allocations.",
            )
        )

    if not db.query(TourItinerary).filter(TourItinerary.tour_id == bali.id).first():
        db.add_all(
            [
                TourItinerary(
                    tour_id=bali.id,
                    day_number=1,
                    title="Arrival and recovery",
                    description="Airport transfer, villa check-in, and sunset recovery session.",
                ),
                TourItinerary(
                    tour_id=bali.id,
                    day_number=2,
                    title="Wellness and terraces",
                    description="Morning wellness activity followed by rice-terrace exploration.",
                ),
            ]
        )

    if not db.query(TourPolicy).filter(TourPolicy.tour_id == bali.id).first():
        db.add(
            TourPolicy(
                tour_id=bali.id,
                cancellation_policy="Free cancellation up to 18 days before departure.",
                refund_policy="50% refund within 7-17 days before departure.",
                notes="Wellness sessions can be adapted for weather or guest health needs.",
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
        {
            "key": "AMALFI-S1",
            "tour_code": "AMALFI-6N5D",
            "departure_date": today + timedelta(days=21),
            "return_date": today + timedelta(days=26),
            "capacity": 16,
            "available_slots": 16,
            "status": TourScheduleStatus.scheduled,
        },
        {
            "key": "CT-S1",
            "tour_code": "CT-5N4D",
            "departure_date": today + timedelta(days=24),
            "return_date": today + timedelta(days=28),
            "capacity": 14,
            "available_slots": 14,
            "status": TourScheduleStatus.scheduled,
        },
        {
            "key": "ICE-S1",
            "tour_code": "ICE-7N6D",
            "departure_date": today + timedelta(days=30),
            "return_date": today + timedelta(days=36),
            "capacity": 18,
            "available_slots": 18,
            "status": TourScheduleStatus.scheduled,
        },
        {
            "key": "BALTIC-S1",
            "tour_code": "BALTIC-6N5D",
            "departure_date": today + timedelta(days=33),
            "return_date": today + timedelta(days=38),
            "capacity": 20,
            "available_slots": 20,
            "status": TourScheduleStatus.scheduled,
        },
        {
            "key": "KYOTO-S1",
            "tour_code": "KYOTO-4N3D",
            "departure_date": today + timedelta(days=17),
            "return_date": today + timedelta(days=20),
            "capacity": 12,
            "available_slots": 12,
            "status": TourScheduleStatus.scheduled,
        },
        {
            "key": "BALI-S1",
            "tour_code": "BALI-5N4D",
            "departure_date": today + timedelta(days=19),
            "return_date": today + timedelta(days=23),
            "capacity": 18,
            "available_slots": 18,
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
        {
            "schedule_key": "AMALFI-S1",
            "traveler_type": TravelerType.adult,
            "price": Decimal("42990000.00"),
        },
        {
            "schedule_key": "AMALFI-S1",
            "traveler_type": TravelerType.child,
            "price": Decimal("36990000.00"),
        },
        {
            "schedule_key": "AMALFI-S1",
            "traveler_type": TravelerType.infant,
            "price": Decimal("9900000.00"),
        },
        {
            "schedule_key": "CT-S1",
            "traveler_type": TravelerType.adult,
            "price": Decimal("33500000.00"),
        },
        {
            "schedule_key": "CT-S1",
            "traveler_type": TravelerType.child,
            "price": Decimal("28900000.00"),
        },
        {
            "schedule_key": "CT-S1",
            "traveler_type": TravelerType.infant,
            "price": Decimal("8500000.00"),
        },
        {
            "schedule_key": "ICE-S1",
            "traveler_type": TravelerType.adult,
            "price": Decimal("58900000.00"),
        },
        {
            "schedule_key": "ICE-S1",
            "traveler_type": TravelerType.child,
            "price": Decimal("51900000.00"),
        },
        {
            "schedule_key": "ICE-S1",
            "traveler_type": TravelerType.infant,
            "price": Decimal("12900000.00"),
        },
        {
            "schedule_key": "BALTIC-S1",
            "traveler_type": TravelerType.adult,
            "price": Decimal("44900000.00"),
        },
        {
            "schedule_key": "BALTIC-S1",
            "traveler_type": TravelerType.child,
            "price": Decimal("38900000.00"),
        },
        {
            "schedule_key": "BALTIC-S1",
            "traveler_type": TravelerType.infant,
            "price": Decimal("9900000.00"),
        },
        {
            "schedule_key": "KYOTO-S1",
            "traveler_type": TravelerType.adult,
            "price": Decimal("31900000.00"),
        },
        {
            "schedule_key": "KYOTO-S1",
            "traveler_type": TravelerType.child,
            "price": Decimal("26900000.00"),
        },
        {
            "schedule_key": "KYOTO-S1",
            "traveler_type": TravelerType.infant,
            "price": Decimal("7900000.00"),
        },
        {
            "schedule_key": "BALI-S1",
            "traveler_type": TravelerType.adult,
            "price": Decimal("28900000.00"),
        },
        {
            "schedule_key": "BALI-S1",
            "traveler_type": TravelerType.child,
            "price": Decimal("23900000.00"),
        },
        {
            "schedule_key": "BALI-S1",
            "traveler_type": TravelerType.infant,
            "price": Decimal("6900000.00"),
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
