import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.error_handlers import (
    app_exception_handler,
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.core.exceptions import AppException
from app.core.logging import configure_logging
from app.core.metrics import operational_metrics, render_prometheus_metrics
from app.core.redis import redis_client
from app.core.runtime_state import runtime_task_state
from app.core.runtime_tasks import (
    run_noncritical_maintenance,
    run_noncritical_maintenance_loop,
)
from app.core.startup import (
    is_email_worker_connection_ready,
    is_malware_scan_connection_ready,
    is_notification_backend_connection_ready,
    is_storage_connection_ready,
    run_startup_checks,
)
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.rate_limit_middleware import RateLimitMiddleware
from app.middleware.request_id_middleware import RequestIDMiddleware
from app.services.outbox_service import OutboxService
from app.utils.ip_utils import ip_in_allowlist
from app.utils.request_context import get_client_ip

configure_logging(debug=settings.DEBUG)


def start_runtime_maintenance_loop():
    stop_event = asyncio.Event()
    task = asyncio.create_task(
        run_noncritical_maintenance_loop(
            stop_event=stop_event,
            interval_seconds=settings.RUNTIME_MAINTENANCE_INTERVAL_SECONDS,
            run_immediately=False,
        )
    )
    return stop_event, task


def _build_outbox_health_snapshot() -> tuple[bool, dict]:
    metrics_snapshot = operational_metrics.snapshot()
    outbox_required = settings.OUTBOX_HEALTH_MODE == "required"
    outbox_backlog = metrics_snapshot.get("outbox_backlog", 0)
    last_dispatch_status = metrics_snapshot.get("outbox_last_dispatch_status", "unknown")
    last_dispatch_reason = metrics_snapshot.get("outbox_last_dispatch_reason")

    outbox_ok = False
    db = None
    try:
        db = SessionLocal()
        outbox_backlog = OutboxService(db=db).get_backlog_count()
        outbox_ok = True
    except Exception:
        outbox_ok = False
    finally:
        if db is not None:
            db.close()

    if last_dispatch_status in {"failure", "skipped"}:
        outbox_ok = False

    return outbox_ok, {
        "healthy": outbox_ok,
        "required_for_readiness": outbox_required,
        "backlog": outbox_backlog,
        "last_dispatch_status": last_dispatch_status,
        "last_dispatch_reason": last_dispatch_reason,
    }


def _database_ready() -> bool:
    db = None
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
    finally:
        if db is not None:
            db.close()


def _redis_ready() -> bool:
    try:
        return redis_client.ping() is True
    except Exception:
        return False


def _build_dependency_checks() -> dict[str, bool]:
    checks = {
        "database": _database_ready(),
        "redis": _redis_ready(),
    }

    for key, checker in (
        ("storage", is_storage_connection_ready),
        ("email_worker", is_email_worker_connection_ready),
        ("notification_backend", is_notification_backend_connection_ready),
        ("malware_scan", is_malware_scan_connection_ready),
    ):
        try:
            checks[key] = checker()
        except Exception:
            checks[key] = False

    return checks


def _enforce_observability_access(request: Request) -> None:
    if settings.OBSERVABILITY_PROTECTION_MODE == "disabled":
        return

    client_ip = get_client_ip(request)
    if client_ip and ip_in_allowlist(client_ip, settings.observability_allowlist_list):
        return

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_startup_checks()
    run_noncritical_maintenance()
    maintenance_stop_event, maintenance_task = start_runtime_maintenance_loop()
    try:
        yield
    finally:
        if maintenance_stop_event is not None:
            maintenance_stop_event.set()
        if maintenance_task is not None:
            await maintenance_task


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.trusted_hosts_list,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(RateLimitMiddleware)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/live")
def health_live():
    return {
        "status": "alive",
        "service": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health/ready")
def health_ready(request: Request):
    _enforce_observability_access(request)
    dependency_checks = _build_dependency_checks()
    outbox_ok, outbox_health = _build_outbox_health_snapshot()
    outbox_required = outbox_health["required_for_readiness"]
    dependency_checks["outbox"] = outbox_ok
    dependency_checks["rate_limit_backend"] = dependency_checks["redis"]
    ready = (
        dependency_checks["database"]
        and dependency_checks["redis"]
        and dependency_checks["storage"]
        and dependency_checks["email_worker"]
        and dependency_checks["notification_backend"]
        and dependency_checks["malware_scan"]
        and (outbox_ok or not outbox_required)
    )
    metrics_snapshot = operational_metrics.snapshot()

    degraded_checks: list[str] = []
    if not outbox_ok and not outbox_required:
        degraded_checks.append("outbox")

    payload = {
        "status": "ready" if ready else "not_ready",
        "service": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "readiness_policy": {
            "outbox_mode": settings.OUTBOX_HEALTH_MODE,
        },
        "checks": dependency_checks,
        "degraded_checks": degraded_checks,
        "outbox": outbox_health,
        "runtime_tasks": runtime_task_state.snapshot(),
        "observability": {
            "rate_limit_backend_failures_total": metrics_snapshot.get(
                "rate_limit_backend_failures_total",
                0,
            ),
            "last_rate_limit_backend_failure_at": metrics_snapshot.get(
                "last_rate_limit_backend_failure_at"
            ),
        },
    }
    return JSONResponse(
        status_code=status.HTTP_200_OK if ready else status.HTTP_503_SERVICE_UNAVAILABLE,
        content=payload,
    )


@app.get("/metrics")
def metrics(request: Request):
    _enforce_observability_access(request)
    backlog = operational_metrics.snapshot().get("outbox_backlog", 0)

    db = None
    try:
        db = SessionLocal()
        backlog = OutboxService(db=db).get_backlog_count()
    except Exception:
        backlog = backlog
    finally:
        if db is not None:
            db.close()

    payload = operational_metrics.snapshot()
    payload["outbox_backlog"] = backlog
    payload["service"] = settings.APP_NAME
    payload["environment"] = settings.ENVIRONMENT
    return payload


@app.get("/metrics/prometheus")
def metrics_prometheus(request: Request):
    _enforce_observability_access(request)
    dependency_checks = _build_dependency_checks()
    outbox_ok, outbox_health = _build_outbox_health_snapshot()
    dependency_checks["outbox"] = outbox_ok
    dependency_checks["rate_limit_backend"] = dependency_checks["redis"]

    metrics_snapshot = operational_metrics.snapshot()
    metrics_snapshot["outbox_backlog"] = outbox_health["backlog"]

    payload = render_prometheus_metrics(
        service=settings.APP_NAME,
        environment=settings.ENVIRONMENT,
        metrics_snapshot=metrics_snapshot,
        dependency_checks=dependency_checks,
        runtime_tasks=runtime_task_state.snapshot(),
        outbox_required_for_readiness=outbox_health["required_for_readiness"],
    )
    return PlainTextResponse(
        payload,
        media_type="text/plain; version=0.0.4; charset=utf-8",
    )


app.include_router(api_router, prefix="/api/v1")
