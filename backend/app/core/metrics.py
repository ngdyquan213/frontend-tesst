from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock
from typing import Any


class OperationalMetrics:
    def __init__(self) -> None:
        self._lock = Lock()
        self._http_requests_total = 0
        self._http_error_responses_total = 0
        self._payment_callback_failures_total = 0
        self._payment_callback_failures_by_reason: dict[str, int] = {}
        self._outbox_backlog = 0
        self._outbox_dispatch_failures_total = 0
        self._outbox_dispatch_failures_by_reason: dict[str, int] = {}
        self._outbox_last_dispatch_status = "unknown"
        self._outbox_last_dispatch_reason: str | None = None
        self._outbox_last_dispatch_at: str | None = None
        self._rate_limit_backend_failures_total = 0
        self._last_rate_limit_backend_failure_at: str | None = None

    @staticmethod
    def _now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()

    def record_request(self, *, status_code: int) -> None:
        with self._lock:
            self._http_requests_total += 1
            if status_code >= 400:
                self._http_error_responses_total += 1

    def record_request_failure(self) -> None:
        with self._lock:
            self._http_requests_total += 1
            self._http_error_responses_total += 1

    def record_payment_callback_failure(self, *, reason: str) -> None:
        with self._lock:
            self._payment_callback_failures_total += 1
            self._payment_callback_failures_by_reason[reason] = (
                self._payment_callback_failures_by_reason.get(reason, 0) + 1
            )

    def set_outbox_backlog(self, value: int) -> None:
        with self._lock:
            self._outbox_backlog = max(0, value)

    def record_outbox_dispatch_result(self, *, status: str, reason: str | None = None) -> None:
        with self._lock:
            self._outbox_last_dispatch_status = status
            self._outbox_last_dispatch_reason = reason
            self._outbox_last_dispatch_at = self._now_iso()

            if status != "success":
                resolved_reason = reason or "unknown"
                self._outbox_dispatch_failures_total += 1
                self._outbox_dispatch_failures_by_reason[resolved_reason] = (
                    self._outbox_dispatch_failures_by_reason.get(resolved_reason, 0) + 1
                )

    def record_rate_limit_backend_failure(self) -> None:
        with self._lock:
            self._rate_limit_backend_failures_total += 1
            self._last_rate_limit_backend_failure_at = self._now_iso()

    def reset(self) -> None:
        with self._lock:
            self._http_requests_total = 0
            self._http_error_responses_total = 0
            self._payment_callback_failures_total = 0
            self._payment_callback_failures_by_reason = {}
            self._outbox_backlog = 0
            self._outbox_dispatch_failures_total = 0
            self._outbox_dispatch_failures_by_reason = {}
            self._outbox_last_dispatch_status = "unknown"
            self._outbox_last_dispatch_reason = None
            self._outbox_last_dispatch_at = None
            self._rate_limit_backend_failures_total = 0
            self._last_rate_limit_backend_failure_at = None

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            return {
                "http_requests_total": self._http_requests_total,
                "http_error_responses_total": self._http_error_responses_total,
                "payment_callback_failures_total": self._payment_callback_failures_total,
                "payment_callback_failures_by_reason": dict(
                    sorted(self._payment_callback_failures_by_reason.items())
                ),
                "outbox_backlog": self._outbox_backlog,
                "outbox_dispatch_failures_total": self._outbox_dispatch_failures_total,
                "outbox_dispatch_failures_by_reason": dict(
                    sorted(self._outbox_dispatch_failures_by_reason.items())
                ),
                "outbox_last_dispatch_status": self._outbox_last_dispatch_status,
                "outbox_last_dispatch_reason": self._outbox_last_dispatch_reason,
                "outbox_last_dispatch_at": self._outbox_last_dispatch_at,
                "rate_limit_backend_failures_total": self._rate_limit_backend_failures_total,
                "last_rate_limit_backend_failure_at": self._last_rate_limit_backend_failure_at,
            }


def _escape_prometheus_label(value: str) -> str:
    return value.replace("\\", "\\\\").replace("\n", "\\n").replace('"', '\\"')


def _format_prometheus_labels(labels: dict[str, str]) -> str:
    if not labels:
        return ""
    encoded = ",".join(
        f'{key}="{_escape_prometheus_label(value)}"' for key, value in sorted(labels.items())
    )
    return f"{{{encoded}}}"


def _to_epoch_seconds(value: str | None) -> float:
    if not value:
        return 0.0
    return datetime.fromisoformat(value).timestamp()


def render_prometheus_metrics(
    *,
    service: str,
    environment: str,
    metrics_snapshot: dict[str, Any],
    dependency_checks: dict[str, bool] | None = None,
    runtime_tasks: dict[str, dict[str, str | None]] | None = None,
    outbox_required_for_readiness: bool | None = None,
) -> str:
    base_labels = {
        "environment": environment,
        "service": service,
    }
    lines: list[str] = []

    def add_metric(
        name: str,
        metric_type: str,
        help_text: str,
        value: int | float,
        *,
        labels: dict[str, str] | None = None,
    ) -> None:
        all_labels = dict(base_labels)
        if labels:
            all_labels.update(labels)
        lines.append(f"# HELP {name} {help_text}")
        lines.append(f"# TYPE {name} {metric_type}")
        lines.append(f"{name}{_format_prometheus_labels(all_labels)} {value}")

    def add_series(
        name: str,
        metric_type: str,
        help_text: str,
        series: list[tuple[dict[str, str], int | float]],
    ) -> None:
        lines.append(f"# HELP {name} {help_text}")
        lines.append(f"# TYPE {name} {metric_type}")
        for labels, value in series:
            all_labels = dict(base_labels)
            all_labels.update(labels)
            lines.append(f"{name}{_format_prometheus_labels(all_labels)} {value}")

    add_metric(
        "secure_travel_app_info",
        "gauge",
        "Static application info metric.",
        1,
    )
    add_metric(
        "secure_travel_http_requests_total",
        "counter",
        "Total HTTP requests handled by the application.",
        int(metrics_snapshot.get("http_requests_total", 0)),
    )
    add_metric(
        "secure_travel_http_error_responses_total",
        "counter",
        "Total HTTP responses with status code >= 400 or failed request handling.",
        int(metrics_snapshot.get("http_error_responses_total", 0)),
    )
    add_metric(
        "secure_travel_payment_callback_failures_total",
        "counter",
        "Total payment callback validation or processing failures.",
        int(metrics_snapshot.get("payment_callback_failures_total", 0)),
    )

    add_series(
        "secure_travel_payment_callback_failures_by_reason_total",
        "counter",
        "Payment callback failures broken down by reason.",
        [
            ({"reason": reason}, count)
            for reason, count in metrics_snapshot.get(
                "payment_callback_failures_by_reason", {}
            ).items()
        ],
    )
    add_metric(
        "secure_travel_outbox_backlog",
        "gauge",
        "Current number of pending outbox events.",
        int(metrics_snapshot.get("outbox_backlog", 0)),
    )
    add_metric(
        "secure_travel_outbox_dispatch_failures_total",
        "counter",
        "Total outbox dispatch failures.",
        int(metrics_snapshot.get("outbox_dispatch_failures_total", 0)),
    )
    add_series(
        "secure_travel_outbox_dispatch_failures_by_reason_total",
        "counter",
        "Outbox dispatch failures broken down by reason.",
        [
            ({"reason": reason}, count)
            for reason, count in metrics_snapshot.get(
                "outbox_dispatch_failures_by_reason", {}
            ).items()
        ],
    )
    add_series(
        "secure_travel_outbox_last_dispatch_status",
        "gauge",
        "One-hot gauge for the last observed outbox dispatch status.",
        [
            (
                {"status": status},
                1 if metrics_snapshot.get("outbox_last_dispatch_status") == status else 0,
            )
            for status in ("success", "failure", "skipped", "unknown")
        ],
    )
    add_metric(
        "secure_travel_outbox_last_dispatch_timestamp_seconds",
        "gauge",
        "Unix timestamp for the last observed outbox dispatch attempt.",
        _to_epoch_seconds(metrics_snapshot.get("outbox_last_dispatch_at")),
    )
    add_metric(
        "secure_travel_rate_limit_backend_failures_total",
        "counter",
        "Total rate limit backend failures.",
        int(metrics_snapshot.get("rate_limit_backend_failures_total", 0)),
    )
    add_metric(
        "secure_travel_rate_limit_backend_last_failure_timestamp_seconds",
        "gauge",
        "Unix timestamp for the last rate limit backend failure.",
        _to_epoch_seconds(metrics_snapshot.get("last_rate_limit_backend_failure_at")),
    )

    if outbox_required_for_readiness is not None:
        add_metric(
            "secure_travel_outbox_required_for_readiness",
            "gauge",
            "Whether outbox health is required for readiness.",
            1 if outbox_required_for_readiness else 0,
        )

    if dependency_checks:
        add_series(
            "secure_travel_dependency_ready",
            "gauge",
            "Dependency readiness state by dependency name.",
            [
                ({"dependency": dependency}, 1 if is_ready else 0)
                for dependency, is_ready in sorted(dependency_checks.items())
            ],
        )

    if runtime_tasks:
        add_series(
            "secure_travel_runtime_task_healthy",
            "gauge",
            "Whether a runtime maintenance task is currently healthy.",
            [
                ({"task": task_name}, 1 if task_state.get("status") == "ok" else 0)
                for task_name, task_state in sorted(runtime_tasks.items())
            ],
        )
        add_series(
            "secure_travel_runtime_task_last_success_timestamp_seconds",
            "gauge",
            "Unix timestamp of the last successful runtime maintenance task execution.",
            [
                (
                    {"task": task_name},
                    _to_epoch_seconds(task_state.get("last_success_at")),
                )
                for task_name, task_state in sorted(runtime_tasks.items())
            ],
        )

    return "\n".join(lines) + "\n"


operational_metrics = OperationalMetrics()
