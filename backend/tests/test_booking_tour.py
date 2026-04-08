from app.core.security import get_password_hash
from app.models.enums import TourScheduleStatus, TourStatus, TravelerType, UserStatus
from app.models.tour import Tour, TourPriceRule, TourSchedule
from app.models.user import User


def create_user_and_login(client, db_session, email: str, username: str):
    user = User(
        email=email,
        username=username,
        full_name=username,
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123"},
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return user, token


def seed_tour_schedule(db_session):
    from datetime import date, timedelta

    tour = Tour(
        code="TEST-TOUR-001",
        name="Test Tour",
        destination="Da Nang",
        description="Test Tour Description",
        duration_days=3,
        duration_nights=2,
        meeting_point="Airport",
        tour_type="domestic",
        status=TourStatus.active,
    )
    db_session.add(tour)
    db_session.flush()

    schedule = TourSchedule(
        tour_id=tour.id,
        departure_date=date.today() + timedelta(days=7),
        return_date=date.today() + timedelta(days=9),
        capacity=10,
        available_slots=10,
        status=TourScheduleStatus.scheduled,
    )
    db_session.add(schedule)
    db_session.flush()

    db_session.add_all(
        [
            TourPriceRule(
                tour_schedule_id=schedule.id,
                traveler_type=TravelerType.adult,
                price="3000000.00",
                currency="VND",
            ),
            TourPriceRule(
                tour_schedule_id=schedule.id,
                traveler_type=TravelerType.child,
                price="2000000.00",
                currency="VND",
            ),
            TourPriceRule(
                tour_schedule_id=schedule.id,
                traveler_type=TravelerType.infant,
                price="500000.00",
                currency="VND",
            ),
        ]
    )
    db_session.commit()
    return schedule


def test_create_tour_booking_success(client, db_session):
    _, token = create_user_and_login(
        client,
        db_session,
        "tourbooking@example.com",
        "tour_booking_user",
    )
    schedule = seed_tour_schedule(db_session)

    resp = client.post(
        "/api/v1/bookings/tours",
        json={
            "tour_schedule_id": str(schedule.id),
            "adult_count": 2,
            "child_count": 1,
            "infant_count": 1,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "pending"
    assert body["currency"] == "VND"
    assert body["total_final_amount"] == "8500000.00"

    db_session.refresh(schedule)
    assert schedule.available_slots == 6


def test_tour_booking_not_enough_slots(client, db_session):
    _, token = create_user_and_login(
        client,
        db_session,
        "tourbooking2@example.com",
        "tour_booking_user_2",
    )
    schedule = seed_tour_schedule(db_session)

    resp = client.post(
        "/api/v1/bookings/tours",
        json={
            "tour_schedule_id": str(schedule.id),
            "adult_count": 8,
            "child_count": 2,
            "infant_count": 2,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 400
    assert resp.json()["detail"] == "Not enough available slots"


def test_tour_booking_requires_at_least_one_traveler(client, db_session):
    _, token = create_user_and_login(
        client,
        db_session,
        "tourbooking3@example.com",
        "tour_booking_user_3",
    )
    schedule = seed_tour_schedule(db_session)

    resp = client.post(
        "/api/v1/bookings/tours",
        json={
            "tour_schedule_id": str(schedule.id),
            "adult_count": 0,
            "child_count": 0,
            "infant_count": 0,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 422
