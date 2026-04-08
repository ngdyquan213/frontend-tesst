from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
from uuid import uuid4

from sqlalchemy.orm import sessionmaker

from app.core.exceptions import ValidationAppException
from app.core.security import get_password_hash
from app.models.booking import Booking, BookingItem, Traveler
from app.models.enums import (
    BookingItemType,
    BookingStatus,
    PaymentStatus,
    TourScheduleStatus,
    TourStatus,
    TravelerType,
    UserStatus,
)
from app.models.tour import Tour, TourPriceRule, TourSchedule
from app.models.user import User
from app.repositories.audit_repository import AuditRepository
from app.repositories.booking_repository import BookingRepository
from app.schemas.traveler import TravelerCreateRequest
from app.services.audit_service import AuditService
from app.services.traveler_service import TravelerService


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
        code="TRAVELER-TOUR-001",
        name="Traveler Tour",
        destination="Phu Quoc",
        description="Traveler test tour",
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


def create_tour_booking(client, token: str, schedule_id: str):
    resp = client.post(
        "/api/v1/bookings/tours",
        json={
            "tour_schedule_id": schedule_id,
            "adult_count": 1,
            "child_count": 1,
            "infant_count": 0,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    return resp.json()


def test_add_and_list_tour_travelers(client, db_session):
    _, token = create_user_and_login(client, db_session, "traveler1@example.com", "traveler1")
    schedule = seed_tour_schedule(db_session)
    booking = create_tour_booking(client, token, str(schedule.id))

    add1 = client.post(
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
    assert add1.status_code == 201

    add2 = client.post(
        f"/api/v1/bookings/{booking['id']}/travelers",
        json={
            "full_name": "Nguyen Thi B",
            "traveler_type": "child",
            "nationality": "VN",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert add2.status_code == 201

    listing = client.get(
        f"/api/v1/bookings/{booking['id']}/travelers",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert listing.status_code == 200
    body = listing.json()
    assert len(body) == 2


def test_cannot_exceed_traveler_type_limit(client, db_session):
    _, token = create_user_and_login(client, db_session, "traveler2@example.com", "traveler2")
    schedule = seed_tour_schedule(db_session)
    booking = create_tour_booking(client, token, str(schedule.id))

    add1 = client.post(
        f"/api/v1/bookings/{booking['id']}/travelers",
        json={
            "full_name": "Adult One",
            "traveler_type": "adult",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert add1.status_code == 201

    add2 = client.post(
        f"/api/v1/bookings/{booking['id']}/travelers",
        json={
            "full_name": "Adult Two",
            "traveler_type": "adult",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert add2.status_code == 400
    assert add2.json()["detail"] == "Traveler count exceeded for type: adult"


def test_traveler_limit_is_enforced_under_concurrency(db_engine):
    SessionLocal = sessionmaker(bind=db_engine, autocommit=False, autoflush=False)
    suffix = uuid4().hex[:8]

    seed_session = SessionLocal()
    user = User(
        email=f"traveler-race-{suffix}@example.com",
        username=f"traveler_race_{suffix}",
        full_name="Traveler Race",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    seed_session.add(user)
    seed_session.flush()

    tour = Tour(
        code=f"TRAVELER-RACE-{suffix.upper()}",
        name="Traveler Race Tour",
        destination="Phu Quoc",
        description="Traveler race test tour",
        duration_days=3,
        duration_nights=2,
        meeting_point="Airport",
        tour_type="domestic",
        status=TourStatus.active,
    )
    seed_session.add(tour)
    seed_session.flush()

    schedule = TourSchedule(
        tour_id=tour.id,
        departure_date=date.today() + timedelta(days=7),
        return_date=date.today() + timedelta(days=9),
        capacity=10,
        available_slots=10,
        status=TourScheduleStatus.scheduled,
    )
    seed_session.add(schedule)
    seed_session.flush()
    seed_session.add_all(
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

    booking = Booking(
        booking_code=f"TB-{suffix.upper()}",
        user_id=user.id,
        status=BookingStatus.pending,
        total_base_amount="3000000.00",
        total_discount_amount="0.00",
        total_final_amount="3000000.00",
        currency="VND",
        payment_status=PaymentStatus.pending,
    )
    seed_session.add(booking)
    seed_session.flush()
    seed_session.add(
        BookingItem(
            booking_id=booking.id,
            item_type=BookingItemType.tour,
            tour_schedule_id=schedule.id,
            quantity=1,
            unit_price="3000000.00",
            total_price="3000000.00",
            metadata_json={"adult_count": 1, "child_count": 0, "infant_count": 0},
        )
    )
    seed_session.commit()

    booking_id = str(booking.id)
    user_id = str(user.id)
    seed_session.close()

    def add_once(index: int) -> tuple[str, str]:
        session = SessionLocal()
        service = TravelerService(
            db=session,
            booking_repo=BookingRepository(session),
            audit_service=AuditService(AuditRepository(session)),
        )

        try:
            service.add_traveler(
                booking_id=booking_id,
                user_id=user_id,
                payload=TravelerCreateRequest(
                    full_name=f"Adult {index}",
                    traveler_type=TravelerType.adult,
                ),
            )
            return "success", str(index)
        except ValidationAppException as exc:
            return "error", str(exc)
        finally:
            session.close()

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(add_once, [1, 2]))

    statuses = Counter(status for status, _value in results)
    assert statuses["success"] == 1
    assert statuses["error"] == 1
    assert any(
        value == "Traveler count exceeded for type: adult"
        for status, value in results
        if status == "error"
    )

    verify_session = SessionLocal()
    traveler_count = (
        verify_session.query(Traveler).filter(Traveler.booking_id == booking_id).count()
    )
    verify_session.close()

    assert traveler_count == 1
