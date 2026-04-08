from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.core.security import get_password_hash
from app.models.enums import UserStatus
from app.models.flight import Airline, Airport, Flight
from app.models.user import User
from app.repositories.booking_repository import BookingRepository


def create_user_and_login(
    client, db_session, *, email: str, username: str, password: str = "Password123"
):
    user = User(
        email=email,
        username=username,
        full_name=username,
        password_hash=get_password_hash(password),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_resp.status_code == 200
    return user, login_resp.json()["access_token"]


def seed_flight(db_session):
    airline = Airline(code="TB", name="Transactional Booking Air")
    dep = Airport(code="TBA", name="A", city="HCM", country="VN")
    arr = Airport(code="TBB", name="B", city="HN", country="VN")
    db_session.add_all([airline, dep, arr])
    db_session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number="TB100",
        departure_airport_id=dep.id,
        arrival_airport_id=arr.id,
        departure_time=datetime.now(timezone.utc) + timedelta(days=1),
        arrival_time=datetime.now(timezone.utc) + timedelta(days=1, hours=2),
        base_price=Decimal("900000.00"),
        available_seats=5,
        status="scheduled",
    )
    db_session.add(flight)
    db_session.commit()
    return flight


def test_booking_create_rolls_back_if_booking_insert_fails(client, db_session, monkeypatch):
    user, token = create_user_and_login(
        client,
        db_session,
        email="tx-booking@example.com",
        username="tx_booking",
    )
    flight = seed_flight(db_session)

    original_add_booking = BookingRepository.add_booking

    def broken_add_booking(self, booking):
        raise RuntimeError("Simulated booking insert failure")

    monkeypatch.setattr(BookingRepository, "add_booking", broken_add_booking)

    resp = client.post(
        "/api/v1/bookings",
        json={"flight_id": str(flight.id), "quantity": 1},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 500

    refreshed_flight = db_session.query(Flight).filter(Flight.id == flight.id).first()
    assert refreshed_flight.available_seats == 5

    monkeypatch.setattr(BookingRepository, "add_booking", original_add_booking)
