from datetime import date, timedelta
from io import BytesIO

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
        code="DOC-TOUR-001",
        name="Doc Tour",
        destination="Phu Quoc",
        description="Document attach test tour",
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


def create_booking_and_traveler(client, token: str, schedule_id: str):
    booking_resp = client.post(
        "/api/v1/bookings/tours",
        json={
            "tour_schedule_id": schedule_id,
            "adult_count": 1,
            "child_count": 1,
            "infant_count": 0,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert booking_resp.status_code == 201
    booking = booking_resp.json()

    traveler_resp = client.post(
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
    assert traveler_resp.status_code == 201
    traveler = traveler_resp.json()

    return booking, traveler


def test_upload_document_for_owned_traveler_success(client, db_session, sample_pdf_bytes):
    _, token = create_user_and_login(client, db_session, "travdoc1@example.com", "travdoc1")
    schedule = seed_tour_schedule(db_session)
    booking, traveler = create_booking_and_traveler(client, token, str(schedule.id))

    resp = client.post(
        "/api/v1/uploads/documents",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("passport.pdf", BytesIO(sample_pdf_bytes), "application/pdf")},
        data={
            "document_type": "passport",
            "booking_id": booking["id"],
            "traveler_id": traveler["id"],
        },
    )

    assert resp.status_code == 201
    body = resp.json()
    assert body["booking_id"] == booking["id"]
    assert body["traveler_id"] == traveler["id"]
    assert body["document_type"] == "passport"


def test_upload_document_rejects_foreign_traveler(client, db_session, sample_pdf_bytes):
    _, token1 = create_user_and_login(client, db_session, "travdoc2a@example.com", "travdoc2a")
    _, token2 = create_user_and_login(client, db_session, "travdoc2b@example.com", "travdoc2b")

    schedule = seed_tour_schedule(db_session)
    _, traveler = create_booking_and_traveler(client, token1, str(schedule.id))

    resp = client.post(
        "/api/v1/uploads/documents",
        headers={"Authorization": f"Bearer {token2}"},
        files={"file": ("passport.pdf", BytesIO(sample_pdf_bytes), "application/pdf")},
        data={
            "document_type": "passport",
            "traveler_id": traveler["id"],
        },
    )

    assert resp.status_code == 400
    assert resp.json()["detail"] == "Traveler not found"
