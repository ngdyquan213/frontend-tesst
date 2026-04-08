from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.models.flight import Airline, Airport, Flight


def seed_flight(
    db_session,
    *,
    code_suffix: str,
    dep_code: str,
    arr_code: str,
    price: str,
    seats: int,
    status: str,
):
    airline = Airline(code=f"AL{code_suffix}", name=f"Airline {code_suffix}")
    dep = db_session.query(Airport).filter(Airport.code == dep_code).first()
    if not dep:
        dep = Airport(code=dep_code, name=f"{dep_code} Airport", city=dep_code, country="VN")
        db_session.add(dep)

    arr = db_session.query(Airport).filter(Airport.code == arr_code).first()
    if not arr:
        arr = Airport(code=arr_code, name=f"{arr_code} Airport", city=arr_code, country="VN")
        db_session.add(arr)

    db_session.add(airline)
    db_session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number=f"VN{code_suffix}",
        departure_airport_id=dep.id,
        arrival_airport_id=arr.id,
        departure_time=datetime.now(timezone.utc) + timedelta(days=1),
        arrival_time=datetime.now(timezone.utc) + timedelta(days=1, hours=2),
        base_price=Decimal(price),
        available_seats=seats,
        status=status,
    )
    db_session.add(flight)
    db_session.commit()
    return flight


def test_list_flights_filter_by_departure_and_arrival(client, db_session):
    seed_flight(
        db_session,
        code_suffix="101",
        dep_code="SGN",
        arr_code="HAN",
        price="1000000.00",
        seats=10,
        status="scheduled",
    )
    seed_flight(
        db_session,
        code_suffix="102",
        dep_code="DAD",
        arr_code="HAN",
        price="1100000.00",
        seats=8,
        status="scheduled",
    )

    resp = client.get("/api/v1/flights?departure_airport_code=SGN&arrival_airport_code=HAN")
    assert resp.status_code == 200
    body = resp.json()

    assert body["total"] >= 1
    assert len(body["items"]) >= 1


def test_list_flights_filter_by_status(client, db_session):
    seed_flight(
        db_session,
        code_suffix="201",
        dep_code="SGN",
        arr_code="HUI",
        price="900000.00",
        seats=4,
        status="scheduled",
    )
    seed_flight(
        db_session,
        code_suffix="202",
        dep_code="SGN",
        arr_code="PQC",
        price="950000.00",
        seats=3,
        status="cancelled",
    )

    resp = client.get("/api/v1/flights?status=cancelled")
    assert resp.status_code == 200
    body = resp.json()

    assert body["total"] >= 1
    assert all(item["status"] == "cancelled" for item in body["items"])


def test_list_flights_sort_by_price_desc(client, db_session):
    seed_flight(
        db_session,
        code_suffix="301",
        dep_code="SGN",
        arr_code="CXR",
        price="700000.00",
        seats=5,
        status="scheduled",
    )
    seed_flight(
        db_session,
        code_suffix="302",
        dep_code="SGN",
        arr_code="VCA",
        price="1400000.00",
        seats=5,
        status="scheduled",
    )

    resp = client.get("/api/v1/flights?sort_by=base_price&sort_order=desc")
    assert resp.status_code == 200
    body = resp.json()

    prices = [Decimal(str(item["base_price"])) for item in body["items"]]
    assert prices == sorted(prices, reverse=True)
