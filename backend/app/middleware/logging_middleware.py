from __future__ import annotations

import logging
import time
from typing import Callable

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.logging import build_log_extra
from app.core.metrics import operational_metrics
from app.utils.request_context import get_client_ip

logger = logging.getLogger("app.http")


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start = time.perf_counter()

        client_ip = get_client_ip(request, default="unknown")
        method = request.method
        path = request.url.path

        try:
            response = await call_next(request)
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            operational_metrics.record_request(status_code=response.status_code)

            logger.info(
                "request_completed",
                extra=build_log_extra(
                    "request_completed",
                    method=method,
                    path=path,
                    status_code=response.status_code,
                    duration_ms=duration_ms,
                    client_ip=client_ip,
                ),
            )
            return response

        except Exception:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            operational_metrics.record_request_failure()

            logger.exception(
                "request_failed",
                extra=build_log_extra(
                    "request_failed",
                    method=method,
                    path=path,
                    duration_ms=duration_ms,
                    client_ip=client_ip,
                ),
            )
            raise
