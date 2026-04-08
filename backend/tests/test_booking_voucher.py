from datetime import date, timedelta

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
    return user, resp.json()["access_token"]


def seed_tour_schedule(db_session):
    tour = Tour(
        code="VOUCHER-TOUR-001",
        name="Voucher Tour",
        destination="Da Nang",
        description="Voucher test tour",
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
        ]
    )
    db_session.commit()
    return schedule


def test_get_tour_booking_voucher(client, db_session):
    _, token = create_user_and_login(client, db_session, "voucher@example.com", "voucher_user")
    schedule = seed_tour_schedule(db_session)

    booking_resp = client.post(
        "/api/v1/bookings/tours",
        json={
            "tour_schedule_id": str(schedule.id),
            "adult_count": 1,
            "child_count": 1,
            "infant_count": 0,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert booking_resp.status_code == 201
    booking = booking_resp.json()

    client.post(
        f"/api/v1/bookings/{booking['id']}/travelers",
        json={
            "full_name": "Nguyen Van A",
            "traveler_type": "adult",
            "passport_number": "P123456",
            "nationality": "VN",
            "document_type": "passport",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    voucher_resp = client.get(
        f"/api/v1/bookings/{booking['id']}/voucher",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert voucher_resp.status_code == 200

    body = voucher_resp.json()
    assert body["booking_id"] == booking["id"]
    assert body["voucher_type"] == "tour_booking_voucher"
    assert body["customer_email"] == "voucher@example.com"
    assert len(body["items"]) == 1
    assert len(body["travelers"]) == 1


def test_cannot_get_foreign_booking_voucher(client, db_session):
    _, token1 = create_user_and_login(client, db_session, "voucher1@example.com", "voucher_user_1")
    _, token2 = create_user_and_login(client, db_session, "voucher2@example.com", "voucher_user_2")

    schedule = seed_tour_schedule(db_session)

    booking_resp = client.post(
        "/api/v1/bookings/tours",
        json={
            "tour_schedule_id": str(schedule.id),
            "adult_count": 1,
            "child_count": 0,
            "infant_count": 0,
        },
        headers={"Authorization": f"Bearer {token1}"},
    )
    booking = booking_resp.json()

    voucher_resp = client.get(
        f"/api/v1/bookings/{booking['id']}/voucher",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert voucher_resp.status_code == 404
    assert voucher_resp.json()["detail"] == "Booking not found"
