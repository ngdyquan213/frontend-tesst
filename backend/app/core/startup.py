from __future__ import annotations

import logging
import smtplib
import socket
import time
from pathlib import Path

from sqlalchemy import text

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.logging import build_log_extra
from app.core.redis import redis_client
from app.services.storage_service import StorageService

logger = logging.getLogger("app.startup")
STARTUP_PROBE_ATTEMPTS = 5
STARTUP_PROBE_DELAY_SECONDS = 1.0


def redact_connection_url(raw_url: str) -> str:
    if "://" not in raw_url or "@" not in raw_url:
        return raw_url

    scheme, remainder = raw_url.split("://", 1)
    credentials, host_part = remainder.rsplit("@", 1)
    username, separator, _password = credentials.partition(":")

    if separator:
        redacted_credentials = f"{username}:***" if username else ":***"
    else:
        redacted_credentials = "***"

    return f"{scheme}://{redacted_credentials}@{host_part}"


def ensure_local_directories() -> None:
    Path(settings.LOCAL_UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    logger.info(
        "startup_directory_ready",
        extra=build_log_extra(
            "startup_directory_ready",
            path=settings.LOCAL_UPLOAD_DIR,
        ),
    )


def check_database_connection() -> None:
    db = None
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        logger.info("startup_database_check_ok", extra=build_log_extra("startup_database_check_ok"))
    except Exception as exc:
        logger.exception("startup_database_check_failed")
        raise RuntimeError("Database connection check failed") from exc
    finally:
        if db is not None:
            db.close()


def check_redis_connection() -> None:
    try:
        pong = redis_client.ping()
        if pong is not True:
            raise RuntimeError("Redis ping did not return True")
        logger.info("startup_redis_check_ok", extra=build_log_extra("startup_redis_check_ok"))
    except Exception as exc:
        logger.exception("startup_redis_check_failed")
        raise RuntimeError("Redis connection check failed") from exc


def is_email_worker_connection_ready() -> bool:
    if settings.EMAIL_WORKER_BACKEND != "smtp":
        return True

    with smtplib.SMTP(
        settings.SMTP_HOST,
        settings.SMTP_PORT,
        timeout=settings.SMTP_TIMEOUT_SECONDS,
    ) as smtp:
        smtp.ehlo_or_helo_if_needed()
        if settings.SMTP_USE_TLS and smtp.has_extn("starttls"):
            smtp.starttls()
            smtp.ehlo()
        status_code, _message = smtp.noop()
    return 200 <= status_code < 400


def check_email_worker_connection() -> None:
    try:
        _run_startup_probe(is_email_worker_connection_ready)
        logger.info(
            "startup_email_worker_check_ok",
            extra=build_log_extra(
                "startup_email_worker_check_ok",
                backend=settings.EMAIL_WORKER_BACKEND,
                host=settings.SMTP_HOST or None,
                port=settings.SMTP_PORT if settings.SMTP_HOST else None,
            ),
        )
    except Exception as exc:
        logger.exception(
            "startup_email_worker_check_failed | backend=%s",
            settings.EMAIL_WORKER_BACKEND,
        )
        raise RuntimeError("Email worker connection check failed") from exc


def is_notification_backend_connection_ready() -> bool:
    if settings.NOTIFICATION_WORKER_BACKEND != "redis":
        return True
    return redis_client.ping() is True


def check_notification_backend_connection() -> None:
    try:
        _run_startup_probe(is_notification_backend_connection_ready)
        logger.info(
            "startup_notification_backend_check_ok",
            extra=build_log_extra(
                "startup_notification_backend_check_ok",
                backend=settings.NOTIFICATION_WORKER_BACKEND,
                channel=settings.NOTIFICATION_REDIS_CHANNEL,
            ),
        )
    except Exception as exc:
        logger.exception(
            "startup_notification_backend_check_failed | backend=%s",
            settings.NOTIFICATION_WORKER_BACKEND,
        )
        raise RuntimeError("Notification backend connection check failed") from exc


def is_malware_scan_connection_ready() -> bool:
    if not settings.UPLOAD_MALWARE_SCAN_ENABLED:
        return True

    if settings.UPLOAD_MALWARE_SCAN_BACKEND == "mock":
        return True

    with socket.create_connection(
        (settings.CLAMAV_HOST, settings.CLAMAV_PORT),
        timeout=settings.CLAMAV_TIMEOUT_SECONDS,
    ) as sock:
        sock.sendall(b"zPING\x00")
        response = sock.recv(64).decode("utf-8", errors="replace").strip()

    return "PONG" in response.upper()


def check_malware_scan_connection() -> None:
    try:
        _run_startup_probe(is_malware_scan_connection_ready)
        logger.info(
            "startup_malware_scan_check_ok",
            extra=build_log_extra(
                "startup_malware_scan_check_ok",
                enabled=settings.UPLOAD_MALWARE_SCAN_ENABLED,
                backend=settings.UPLOAD_MALWARE_SCAN_BACKEND,
                host=settings.CLAMAV_HOST if settings.UPLOAD_MALWARE_SCAN_ENABLED else None,
                port=settings.CLAMAV_PORT if settings.UPLOAD_MALWARE_SCAN_ENABLED else None,
            ),
        )
    except Exception as exc:
        logger.exception(
            "startup_malware_scan_check_failed | backend=%s",
            settings.UPLOAD_MALWARE_SCAN_BACKEND,
        )
        raise RuntimeError("Malware scan connection check failed") from exc


def is_storage_connection_ready() -> bool:
    storage_service = StorageService()

    if storage_service.backend == "local":
        storage_service.local_upload_dir.mkdir(parents=True, exist_ok=True)
        return (
            storage_service.local_upload_dir.exists()
            and storage_service.local_upload_dir.is_dir()
        )

    storage_service._s3_client().head_bucket(Bucket=settings.S3_BUCKET_NAME)
    return True


def check_storage_connection() -> None:
    try:
        if not is_storage_connection_ready():
            raise RuntimeError("Storage readiness probe returned false")
        logger.info(
            "startup_storage_check_ok",
            extra=build_log_extra(
                "startup_storage_check_ok",
                backend=settings.STORAGE_BACKEND,
            ),
        )
    except Exception as exc:
        logger.exception("startup_storage_check_failed | backend=%s", settings.STORAGE_BACKEND)
        raise RuntimeError("Storage connection check failed") from exc


def _run_startup_probe(probe) -> None:
    last_error: Exception | None = None

    for attempt in range(STARTUP_PROBE_ATTEMPTS):
        try:
            if probe():
                return
            last_error = RuntimeError("readiness probe returned false")
        except Exception as exc:  # pragma: no cover - exercised by wrapper tests
            last_error = exc

        if attempt < STARTUP_PROBE_ATTEMPTS - 1:
            time.sleep(STARTUP_PROBE_DELAY_SECONDS)

    if last_error is not None:
        raise last_error
    raise RuntimeError("readiness probe returned false")


def log_startup_summary() -> None:
    logger.info(
        "startup_summary",
        extra=build_log_extra(
            "startup_summary",
            app_name=settings.APP_NAME,
            environment=settings.ENVIRONMENT,
            debug=settings.DEBUG,
            database_url=redact_connection_url(settings.DATABASE_URL),
            redis_url=redact_connection_url(settings.REDIS_URL),
            upload_dir=settings.LOCAL_UPLOAD_DIR,
            email_worker=settings.EMAIL_WORKER_BACKEND,
            notification_worker=settings.NOTIFICATION_WORKER_BACKEND,
            secret_source=settings.SECRET_SOURCE,
            secret_manager_provider=settings.SECRET_MANAGER_PROVIDER or None,
            payment_callback_source_allowlist_enabled=bool(
                settings.payment_callback_source_allowlist_list
            ),
            malware_scan_enabled=settings.UPLOAD_MALWARE_SCAN_ENABLED,
            malware_scan_backend=settings.UPLOAD_MALWARE_SCAN_BACKEND,
        ),
    )


def run_startup_checks() -> None:
    log_startup_summary()
    if settings.ENVIRONMENT in {"staging", "production"} and settings.SECRET_SOURCE == "env":  # nosec B105
        logger.warning(
            "startup_secret_source_env_warning",
            extra=build_log_extra(
                "startup_secret_source_env_warning",
                environment=settings.ENVIRONMENT,
                recommendation="Use a managed secret store for staging/production",
            ),
        )
    ensure_local_directories()
    check_storage_connection()
    check_database_connection()
    check_redis_connection()
    check_email_worker_connection()
    check_notification_backend_connection()
    check_malware_scan_connection()
