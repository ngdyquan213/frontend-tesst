from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.core.security import get_password_hash
from app.models.enums import UserStatus
from app.models.flight import Airline, Airport, Flight
from app.models.user import User


def create_user_and_token(client, db_session):
    user = User(
        email="booking@example.com",
        username="booking_user",
        full_name="Booking User",
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
        json={"email": "booking@example.com", "password": "Password123"},
    )
    token = resp.json()["access_token"]
    return user, token


def seed_flight(db_session):
    airline = Airline(code="T1", name="Test Airline")
    dep = Airport(code="AAA", name="Airport A", city="A City", country="VN")
    arr = Airport(code="BBB", name="Airport B", city="B City", country="VN")
    db_session.add_all([airline, dep, arr])
    db_session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number="T100",
        departure_airport_id=dep.id,
        arrival_airport_id=arr.id,
        departure_time=datetime.now(timezone.utc) + timedelta(days=1),
        arrival_time=datetime.now(timezone.utc) + timedelta(days=1, hours=2),
        base_price=Decimal("1000000.00"),
        available_seats=3,
        status="scheduled",
    )
    db_session.add(flight)
    db_session.commit()
    return flight


def test_create_booking_reduces_available_seats(client, db_session):
    _, token = create_user_and_token(client, db_session)
    flight = seed_flight(db_session)

    resp = client.post(
        "/api/v1/bookings",
        json={"flight_id": str(flight.id), "quantity": 2},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201

    db_session.refresh(flight)
    assert flight.available_seats == 1
