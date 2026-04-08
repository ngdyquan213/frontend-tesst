from __future__ import annotations

import json
import logging
import sys
from contextvars import ContextVar
from datetime import datetime, timezone

request_id_ctx_var: ContextVar[str | None] = ContextVar("request_id", default=None)


class RequestContextFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx_var.get() or "-"
        return True


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", "-"),
        }

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        for attr in ("pathname", "lineno", "funcName"):
            if hasattr(record, attr):
                payload[attr] = getattr(record, attr)

        event_name = getattr(record, "event_name", None)
        if event_name:
            payload["event"] = event_name

        structured_data = getattr(record, "structured_data", None)
        if isinstance(structured_data, dict):
            payload.update(structured_data)

        return json.dumps(payload, ensure_ascii=False)


class StructuredDebugFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        message = super().format(record)

        event_name = getattr(record, "event_name", None)
        structured_data = getattr(record, "structured_data", None)
        details: list[str] = []

        if event_name:
            details.append(f"event={event_name}")

        if isinstance(structured_data, dict):
            details.extend(
                f"{key}={value}" for key, value in structured_data.items() if value is not None
            )

        if details:
            return f"{message} | {' '.join(details)}"
        return message


def build_log_extra(event_name: str, **structured_data):
    return {
        "event_name": event_name,
        "structured_data": structured_data,
    }


def configure_logging(debug: bool = True) -> None:
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG if debug else logging.INFO)

    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)

    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(RequestContextFilter())

    if debug:
        formatter = StructuredDebugFormatter(
            fmt="%(asctime)s | %(levelname)s | %(name)s | request_id=%(request_id)s | %(message)s"
        )
    else:
        formatter = JsonFormatter()

    handler.setFormatter(formatter)
    root_logger.addHandler(handler)

    for logger_name in ("uvicorn", "uvicorn.access", "uvicorn.error", "fastapi"):
        logger = logging.getLogger(logger_name)
        logger.handlers = [handler]
        logger.propagate = False
