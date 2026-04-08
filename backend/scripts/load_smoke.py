from __future__ import annotations

import argparse
import asyncio
import statistics
import time
from dataclasses import dataclass

import httpx

VALID_PDF_BYTES = (
    b"%PDF-1.4\n"
    b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    b"3 0 obj\n"
    b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] "
    b"/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\n"
    b"endobj\n"
    b"4 0 obj\n<< /Length 37 >>\nstream\n"
    b"BT /F1 18 Tf 50 120 Td (Test PDF) Tj ET\n"
    b"endstream\nendobj\n"
    b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
    b"xref\n0 6\n"
    b"0000000000 65535 f \n"
    b"0000000009 00000 n \n"
    b"0000000058 00000 n \n"
    b"0000000115 00000 n \n"
    b"0000000241 00000 n \n"
    b"0000000328 00000 n \n"
    b"trailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n398\n%%EOF\n"
)


@dataclass
class ScenarioResult:
    name: str
    durations_ms: list[float]
    failures: list[str]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run a lightweight production-like load smoke suite."
    )
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8000/api/v1",
        help="API base URL, for example http://127.0.0.1:8000/api/v1",
    )
    parser.add_argument("--traveler-email", default="qa.customer@example.com")
    parser.add_argument("--traveler-password", default="Traveler12345")
    parser.add_argument(
        "--iterations",
        type=int,
        default=3,
        help="How many requests to run per scenario.",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=2,
        help="Maximum number of in-flight requests per scenario.",
    )
    parser.add_argument(
        "--timeout-seconds",
        type=float,
        default=20,
        help="Per-request timeout.",
    )
    return parser


async def login_headers(
    client: httpx.AsyncClient,
    *,
    email: str,
    password: str,
) -> dict[str, str]:
    response = await client.post("/auth/login", json={"email": email, "password": password})
    response.raise_for_status()
    payload = response.json()
    access_token = payload.get("access_token")
    if not access_token:
        raise RuntimeError("Login response did not contain an access token.")
    return {"Authorization": f"Bearer {access_token}"}


async def resolve_schedule_id(client: httpx.AsyncClient) -> str:
    response = await client.get("/tours")
    response.raise_for_status()
    payload = response.json()
    items = payload.get("items", [])
    for tour in items:
        for schedule in tour.get("schedules", []):
            if schedule.get("available_slots", 0) > 0:
                return str(schedule["id"])
    raise RuntimeError("No tour schedule with available slots was found for load smoke testing.")


async def exercise_login(
    client: httpx.AsyncClient,
    *,
    email: str,
    password: str,
) -> None:
    response = await client.post("/auth/login", json={"email": email, "password": password})
    response.raise_for_status()


async def exercise_checkout(
    client: httpx.AsyncClient,
    *,
    email: str,
    password: str,
    schedule_id: str,
    iteration: int,
) -> None:
    headers = await login_headers(client, email=email, password=password)
    response = await client.post(
        "/payments/checkout/tours",
        json={
            "tour_schedule_id": schedule_id,
            "adult_count": 1,
            "child_count": 0,
            "infant_count": 0,
            "payment_method": "manual",
        },
        headers={
            **headers,
            "Idempotency-Key": f"load-smoke-checkout-{int(time.time() * 1000)}-{iteration}",
        },
    )
    response.raise_for_status()


async def exercise_upload(
    client: httpx.AsyncClient,
    *,
    email: str,
    password: str,
    iteration: int,
) -> None:
    headers = await login_headers(client, email=email, password=password)
    response = await client.post(
        "/uploads/documents",
        data={"document_type": "passport"},
        files={
            "file": (
                f"load-smoke-{iteration}.pdf",
                VALID_PDF_BYTES,
                "application/pdf",
            )
        },
        headers=headers,
    )
    response.raise_for_status()


async def run_scenario(
    name: str,
    iterations: int,
    concurrency: int,
    operation,
) -> ScenarioResult:
    durations_ms: list[float] = []
    failures: list[str] = []
    semaphore = asyncio.Semaphore(concurrency)

    async def run_once(iteration: int) -> None:
        async with semaphore:
            started_at = time.perf_counter()
            try:
                await operation(iteration)
            except Exception as exc:  # noqa: BLE001
                failures.append(f"iteration {iteration}: {exc}")
            finally:
                durations_ms.append((time.perf_counter() - started_at) * 1000)

    await asyncio.gather(*(run_once(iteration) for iteration in range(iterations)))
    return ScenarioResult(name=name, durations_ms=durations_ms, failures=failures)


def summarize_result(result: ScenarioResult) -> str:
    p95 = (
        statistics.quantiles(result.durations_ms, n=20)[-1]
        if len(result.durations_ms) >= 2
        else result.durations_ms[0]
    )
    avg = statistics.fmean(result.durations_ms)
    return (
        f"{result.name}: count={len(result.durations_ms)} "
        f"avg_ms={avg:.1f} p95_ms={p95:.1f} failures={len(result.failures)}"
    )


async def main() -> int:
    args = build_parser().parse_args()

    async with httpx.AsyncClient(
        base_url=args.base_url.rstrip("/"),
        timeout=args.timeout_seconds,
        follow_redirects=True,
    ) as client:
        schedule_id = await resolve_schedule_id(client)

        scenarios = await asyncio.gather(
            run_scenario(
                "auth_login",
                args.iterations,
                args.concurrency,
                lambda _: exercise_login(
                    client,
                    email=args.traveler_email,
                    password=args.traveler_password,
                ),
            ),
            run_scenario(
                "tour_checkout",
                args.iterations,
                args.concurrency,
                lambda iteration: exercise_checkout(
                    client,
                    email=args.traveler_email,
                    password=args.traveler_password,
                    schedule_id=schedule_id,
                    iteration=iteration,
                ),
            ),
            run_scenario(
                "document_upload",
                args.iterations,
                args.concurrency,
                lambda iteration: exercise_upload(
                    client,
                    email=args.traveler_email,
                    password=args.traveler_password,
                    iteration=iteration,
                ),
            ),
        )

    print("load_smoke: summary")
    for result in scenarios:
        print(f"- {summarize_result(result)}")
        for failure in result.failures:
            print(f"  {failure}")

    return 0 if all(not result.failures for result in scenarios) else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
