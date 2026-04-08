from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

REQUIRED_HEADERS = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Smoke-test an HTTP deployment stack.")
    parser.add_argument(
        "--base-url",
        default=os.getenv("SMOKE_BASE_URL", "http://localhost"),
        help="Base URL to probe. Defaults to SMOKE_BASE_URL or http://localhost.",
    )
    parser.add_argument(
        "--expected-environment",
        default=os.getenv("SMOKE_EXPECT_ENVIRONMENT", "development"),
        help="Expected environment value returned by /health/live and /health/ready.",
    )
    parser.add_argument(
        "--prometheus-url",
        default=os.getenv("SMOKE_PROMETHEUS_URL"),
        help="Optional Prometheus base URL to validate, e.g. http://localhost:9090.",
    )
    return parser.parse_args()


def fetch(base_url: str, path: str) -> tuple[int, dict[str, str], bytes]:
    request = urllib.request.Request(f"{base_url}{path}")
    with urllib.request.urlopen(request, timeout=10) as response:
        status = response.getcode()
        headers = dict(response.headers.items())
        body = response.read()
    return status, headers, body


def assert_true(value: bool, message: str) -> None:
    if not value:
        raise AssertionError(message)


def assert_equal(actual, expected, message: str) -> None:
    if actual != expected:
        raise AssertionError(f"{message}: expected={expected!r} actual={actual!r}")


def wait_for_assertion(
    description: str,
    assertion,
    *,
    timeout_seconds: int = 30,
    interval_seconds: float = 2.0,
):
    deadline = time.time() + timeout_seconds
    last_error: AssertionError | None = None

    while time.time() < deadline:
        try:
            return assertion()
        except AssertionError as exc:
            last_error = exc
            time.sleep(interval_seconds)

    if last_error is not None:
        raise AssertionError(f"{description}: {last_error}") from last_error
    raise AssertionError(f"{description}: condition was not met")


def main() -> int:
    args = parse_args()
    base_url = args.base_url.rstrip("/")

    try:
        live_status, live_headers, live_body = fetch(base_url, "/health/live")
        ready_status, _, ready_body = fetch(base_url, "/health/ready")
        metrics_status, _, metrics_body = fetch(base_url, "/metrics")
        metrics_prom_status, metrics_prom_headers, metrics_prom_body = fetch(
            base_url,
            "/metrics/prometheus",
        )
    except urllib.error.URLError as exc:
        print(f"smoke_local_stack: unable to reach {base_url}: {exc}", file=sys.stderr)
        return 1

    assert_equal(live_status, 200, "live endpoint status")
    assert_equal(ready_status, 200, "ready endpoint status")
    assert_equal(metrics_status, 200, "metrics endpoint status")
    assert_equal(metrics_prom_status, 200, "Prometheus metrics endpoint status")

    live_payload = json.loads(live_body.decode("utf-8"))
    ready_payload = json.loads(ready_body.decode("utf-8"))
    metrics_payload = json.loads(metrics_body.decode("utf-8"))

    assert_equal(live_payload["status"], "alive", "live endpoint payload")
    assert_equal(ready_payload["status"], "ready", "ready endpoint payload")
    assert_equal(
        live_payload["environment"], args.expected_environment, "live endpoint environment"
    )
    assert_equal(
        ready_payload["environment"], args.expected_environment, "ready endpoint environment"
    )
    assert_equal(ready_payload["checks"]["database"], True, "database readiness")
    assert_equal(ready_payload["checks"]["redis"], True, "redis readiness")
    assert_equal(ready_payload["checks"]["storage"], True, "storage readiness")
    assert_equal(ready_payload["checks"]["email_worker"], True, "email worker readiness")
    assert_equal(
        ready_payload["checks"]["notification_backend"],
        True,
        "notification backend readiness",
    )
    assert_equal(ready_payload["checks"]["malware_scan"], True, "malware scan readiness")
    assert_equal(ready_payload["checks"]["outbox"], True, "outbox readiness")
    assert_equal(metrics_payload["environment"], args.expected_environment, "metrics environment")
    assert_true(
        "secure_travel_app_info" in metrics_prom_body.decode("utf-8"),
        "Prometheus metrics payload is missing secure_travel_app_info",
    )
    assert_true(
        metrics_prom_headers.get("Content-Type", "").startswith("text/plain"),
        "Prometheus metrics content type should be text/plain",
    )

    runtime_tasks = ready_payload["runtime_tasks"]
    process_outbox_state = runtime_tasks.get("process_outbox_events") or {}
    assert_equal(process_outbox_state.get("status"), "ok", "process_outbox_events runtime state")

    for header_name, expected_value in REQUIRED_HEADERS.items():
        assert_equal(live_headers.get(header_name), expected_value, f"{header_name} header")

    prometheus_payload = None
    if args.prometheus_url:
        prometheus_base_url = args.prometheus_url.rstrip("/")
        ready_status, _, _ = fetch(prometheus_base_url, "/-/ready")
        assert_equal(ready_status, 200, "Prometheus readiness")

        def load_prometheus_targets():
            targets_status, _, targets_body = fetch(prometheus_base_url, "/api/v1/targets")
            assert_equal(targets_status, 200, "Prometheus targets endpoint")

            targets_payload = json.loads(targets_body.decode("utf-8"))
            active_targets = targets_payload.get("data", {}).get("activeTargets", [])
            secure_travel_targets = [
                target
                for target in active_targets
                if target.get("labels", {}).get("job") == "secure-travel-app"
            ]
            assert_true(bool(secure_travel_targets), "Prometheus is not scraping secure-travel-app")
            assert_true(
                all(target.get("health") == "up" for target in secure_travel_targets),
                "secure-travel-app Prometheus target is not healthy",
            )
            return secure_travel_targets

        secure_travel_targets = wait_for_assertion(
            "Prometheus target readiness",
            load_prometheus_targets,
        )

        rules_status, _, rules_body = fetch(prometheus_base_url, "/api/v1/rules?type=alert")
        assert_equal(rules_status, 200, "Prometheus rules endpoint")
        rules_payload = json.loads(rules_body.decode("utf-8"))
        alert_groups = rules_payload.get("data", {}).get("groups", [])
        alert_names = {
            rule.get("name")
            for group in alert_groups
            for rule in group.get("rules", [])
            if rule.get("type") == "alerting"
        }
        expected_alerts = {
            "SecureTravelRedisDown",
            "SecureTravelOutboxBacklogHigh",
            "SecureTravelPaymentCallbackFailuresSpike",
            "SecureTravelRateLimitBackendFailures",
        }
        missing_alerts = sorted(expected_alerts - alert_names)
        assert_true(
            not missing_alerts,
            f"Prometheus alert rules missing expected alerts: {', '.join(missing_alerts)}",
        )
        prometheus_payload = {
            "targets": secure_travel_targets,
            "alerts": sorted(alert_names),
        }

    print("smoke_local_stack: PASS")
    report = {"live": live_payload, "ready": ready_payload, "metrics": metrics_payload}
    if prometheus_payload is not None:
        report["prometheus"] = prometheus_payload
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
