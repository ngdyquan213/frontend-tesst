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
        code="VOUCHER-DOC-001",
        name="Voucher Doc Tour",
        destination="Da Nang",
        description="Voucher document test tour",
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


def test_generate_booking_voucher_document(client, db_session):
    _, token = create_user_and_login(client, db_session, "vdoc@example.com", "vdoc")
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

    generate_resp = client.post(
        f"/api/v1/bookings/{booking['id']}/voucher/generate",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert generate_resp.status_code == 201

    body = generate_resp.json()
    assert body["booking_id"] == booking["id"]
    assert body["document_type"] == "voucher"
    assert body["mime_type"] == "application/pdf"
    assert "storage_key" not in body
    assert "stored_filename" not in body

    docs_resp = client.get(
        "/api/v1/uploads/documents",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert docs_resp.status_code == 200
    docs = docs_resp.json()
    assert any(doc["document_type"] == "voucher" for doc in docs)
