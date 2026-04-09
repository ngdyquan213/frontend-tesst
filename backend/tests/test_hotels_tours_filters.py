from datetime import date, timedelta

from app.models.enums import TourScheduleStatus, TravelerType
from app.models.hotel import Hotel
from app.models.tour import Tour, TourPriceRule, TourSchedule


def seed_hotel(db_session, *, name: str, city: str, country: str, star_rating: int):
    hotel = Hotel(
        name=name,
        city=city,
        country=country,
        star_rating=star_rating,
        description=f"{name} description",
    )
    db_session.add(hotel)
    db_session.commit()
    return hotel


def seed_tour(
    db_session,
    *,
    code: str,
    name: str,
    destination: str,
    tour_type: str,
    status: str,
    duration_days: int = 3,
):
    tour = Tour(
        code=code,
        name=name,
        destination=destination,
        description=f"{name} description",
        duration_days=duration_days,
        duration_nights=max(duration_days - 1, 1),
        meeting_point="City Center",
        tour_type=tour_type,
        status=status,
    )
    db_session.add(tour)
    db_session.commit()
    return tour


def seed_tour_schedule(db_session, *, tour: Tour, capacity: int, adult_price: str):
    schedule = TourSchedule(
        tour_id=tour.id,
        departure_date=date.today() + timedelta(days=7),
        return_date=date.today() + timedelta(days=9),
        capacity=capacity,
        available_slots=capacity,
        status=TourScheduleStatus.scheduled,
    )
    db_session.add(schedule)
    db_session.flush()
    db_session.add(
        TourPriceRule(
            tour_schedule_id=schedule.id,
            traveler_type=TravelerType.adult,
            price=adult_price,
            currency="USD",
        )
    )
    db_session.commit()
    return schedule


def test_list_hotels_filter_by_city_and_star_rating(client, db_session):
    seed_hotel(db_session, name="Danang Luxury", city="Da Nang", country="Vietnam", star_rating=5)
    seed_hotel(db_session, name="Hanoi Budget", city="Ha Noi", country="Vietnam", star_rating=3)

    resp = client.get("/api/v1/hotels?city=Da%20Nang&min_star_rating=4")
    assert resp.status_code == 200
    body = resp.json()

    assert body["total"] >= 1
    assert all("Da Nang" in item["city"] for item in body["items"])
    assert all(item["star_rating"] >= 4 for item in body["items"])


def test_list_hotels_sort_by_star_rating_desc(client, db_session):
    seed_hotel(db_session, name="Hotel Three", city="Hue", country="Vietnam", star_rating=3)
    seed_hotel(db_session, name="Hotel Five", city="Hue", country="Vietnam", star_rating=5)

    resp = client.get("/api/v1/hotels?sort_by=star_rating&sort_order=desc")
    assert resp.status_code == 200
    body = resp.json()

    ratings = [item["star_rating"] for item in body["items"]]
    assert ratings == sorted(ratings, reverse=True)


def test_list_tours_filter_by_destination_and_type(client, db_session):
    seed_tour(
        db_session,
        code="TOUR-DL-001",
        name="Da Lat Chill",
        destination="Da Lat",
        tour_type="domestic",
        status="active",
    )
    seed_tour(
        db_session,
        code="TOUR-BKK-001",
        name="Bangkok Fun",
        destination="Bangkok",
        tour_type="international",
        status="active",
    )

    resp = client.get("/api/v1/tours?destination=Da%20Lat&tour_type=domestic")
    assert resp.status_code == 200
    body = resp.json()

    assert body["total"] >= 1
    assert all("Da Lat" in item["destination"] for item in body["items"])
    assert all(item["tour_type"] == "domestic" for item in body["items"])


def test_list_tours_sort_by_duration_desc(client, db_session):
    seed_tour(
        db_session,
        code="TOUR-DUR-001",
        name="Short Tour",
        destination="Nha Trang",
        tour_type="domestic",
        status="active",
    )
    seed_tour(
        db_session,
        code="TOUR-DUR-002",
        name="Long Tour",
        destination="Nha Trang",
        tour_type="domestic",
        status="active",
    )

    long_tour = db_session.query(Tour).filter(Tour.code == "TOUR-DUR-002").first()
    long_tour.duration_days = 5
    db_session.commit()

    resp = client.get("/api/v1/tours?sort_by=duration_days&sort_order=desc")
    assert resp.status_code == 200
    body = resp.json()

    durations = [item["duration_days"] for item in body["items"]]
    assert durations == sorted(durations, reverse=True)


def test_list_tours_filter_by_duration_group_size_and_price_range(client, db_session):
    intimate_tour = seed_tour(
        db_session,
        code="TOUR-SMALL-001",
        name="Kyoto Calm",
        destination="Kyoto",
        tour_type="cultural",
        status="active",
        duration_days=4,
    )
    large_tour = seed_tour(
        db_session,
        code="TOUR-LARGE-001",
        name="Kyoto Grand",
        destination="Kyoto",
        tour_type="cultural",
        status="active",
        duration_days=11,
    )
    seed_tour_schedule(db_session, tour=intimate_tour, capacity=8, adult_price="1200.00")
    seed_tour_schedule(db_session, tour=large_tour, capacity=16, adult_price="3200.00")

    resp = client.get(
        "/api/v1/tours"
        "?destination=Kyoto"
        "&duration=short"
        "&group_size=intimate"
        "&price_range=under-1500"
    )
    assert resp.status_code == 200
    body = resp.json()

    assert body["total"] >= 1
    returned_names = [item["name"] for item in body["items"]]
    assert "Kyoto Calm" in returned_names
    assert "Kyoto Grand" not in returned_names
