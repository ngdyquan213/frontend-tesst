from __future__ import annotations

import argparse
import json
import statistics
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

DEMO_BOOKING_CODE = "BK-DEMO-FLIGHT-001"
DEMO_EMAIL = "qa.customer@example.com"
DEMO_PASSWORD = "Traveler12345"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Verify a seeded deployment and optionally apply light concurrent load."
    )
    parser.add_argument("--base-url", default="http://localhost:8080/api/v1")
    parser.add_argument("--email", default=DEMO_EMAIL)
    parser.add_argument("--password", default=DEMO_PASSWORD)
    parser.add_argument("--booking-code", default=DEMO_BOOKING_CODE)
    parser.add_argument("--concurrency", type=int, default=1)
    parser.add_argument("--iterations", type=int, default=1)
    parser.add_argument("--timeout", type=float, default=10.0)
    return parser.parse_args()


def http_json(
    url: str,
    *,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    payload: dict | None = None,
    timeout: float = 10.0,
) -> tuple[int, dict]:
    body = None
    merged_headers = {"Content-Type": "application/json"} if payload is not None else {}
    if headers:
        merged_headers.update(headers)
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(url, data=body, headers=merged_headers, method=method)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.getcode(), json.loads(response.read().decode("utf-8"))


def fetch_booking_id(bookings_payload: dict, booking_code: str) -> str:
    for item in bookings_payload.get("items", []):
        if item.get("booking_code") == booking_code:
            return str(item["id"])
    raise AssertionError(f"Booking code not found in response: {booking_code}")


def assert_catalog_payload(catalog_payload: dict | list, endpoint_name: str) -> None:
    if isinstance(catalog_payload, list):
        assert catalog_payload, f"{endpoint_name} returned no catalog data"
        return

    if isinstance(catalog_payload, dict):
        items = catalog_payload.get("items")
        assert isinstance(items, list) and items, f"{endpoint_name} returned no catalog data"
        return

    raise AssertionError(f"{endpoint_name} returned an unexpected payload shape")


def verify_demo_journey(
    *,
    base_url: str,
    email: str,
    password: str,
    booking_code: str,
    timeout: float,
) -> dict[str, float | str]:
    start = time.perf_counter()
    login_status, login_payload = http_json(
        f"{base_url}/auth/login",
        method="POST",
        payload={"email": email, "password": password},
        timeout=timeout,
    )
    assert login_status == 200, f"login failed with status {login_status}"

    access_token = login_payload["access_token"]
    auth_headers = {"Authorization": f"Bearer {access_token}"}

    me_status, me_payload = http_json(
        f"{base_url}/users/me",
        headers=auth_headers,
        timeout=timeout,
    )
    assert me_status == 200, f"/users/me failed with status {me_status}"
    assert me_payload["email"] == email, "logged in user email mismatch"

    flights_status, flights_payload = http_json(
        f"{base_url}/flights",
        timeout=timeout,
    )
    assert flights_status == 200, f"/flights failed with status {flights_status}"
    assert_catalog_payload(flights_payload, "/flights")

    bookings_status, bookings_payload = http_json(
        f"{base_url}/bookings?page=1&page_size=20",
        headers=auth_headers,
        timeout=timeout,
    )
    assert bookings_status == 200, f"/bookings failed with status {bookings_status}"
    booking_id = fetch_booking_id(bookings_payload, booking_code)

    payment_status_code, payment_payload = http_json(
        f"{base_url}/payments/booking/{urllib.parse.quote(booking_id)}",
        headers=auth_headers,
        timeout=timeout,
    )
    assert payment_status_code == 200, f"/payments/booking failed with status {payment_status_code}"
    assert payment_payload["booking_payment_status"] == "paid", "demo booking should be paid"
    assert payment_payload["payment"], "demo booking should have a payment record"

    elapsed_ms = (time.perf_counter() - start) * 1000
    return {
        "elapsed_ms": round(elapsed_ms, 2),
        "booking_id": booking_id,
        "user_email": me_payload["email"],
    }


def run_concurrent_verification(args: argparse.Namespace) -> tuple[list[dict], list[str]]:
    successes: list[dict] = []
    failures: list[str] = []
    lock = threading.Lock()

    def worker(worker_index: int) -> None:
        for iteration in range(args.iterations):
            try:
                result = verify_demo_journey(
                    base_url=args.base_url.rstrip("/"),
                    email=args.email,
                    password=args.password,
                    booking_code=args.booking_code,
                    timeout=args.timeout,
                )
                result["worker"] = worker_index
                result["iteration"] = iteration
                with lock:
                    successes.append(result)
            except (AssertionError, KeyError, urllib.error.URLError) as exc:
                with lock:
                    failures.append(f"worker={worker_index} iteration={iteration}: {exc}")

    threads = [
        threading.Thread(target=worker, args=(index,), daemon=True)
        for index in range(args.concurrency)
    ]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    return successes, failures


def main() -> int:
    args = parse_args()
    successes, failures = run_concurrent_verification(args)
    total_runs = args.concurrency * args.iterations

    latencies = [item["elapsed_ms"] for item in successes]
    report = {
        "base_url": args.base_url,
        "total_runs": total_runs,
        "successes": len(successes),
        "failures": len(failures),
        "p50_ms": round(statistics.median(latencies), 2) if latencies else None,
        "p95_ms": (
            round(statistics.quantiles(latencies, n=20)[18], 2)
            if len(latencies) >= 20
            else (max(latencies) if latencies else None)
        ),
    }

    if failures:
        print("release_verify_demo: FAIL")
        for failure in failures:
            print(f"- {failure}")
        print(json.dumps(report, indent=2))
        return 1

    print("release_verify_demo: PASS")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
