import logging

from fastapi import APIRouter, Request, status

from app.core.logging import build_log_extra
from app.schemas.client_event import ClientRuntimeErrorRequest, ClientRuntimeErrorResponse
from app.utils.request_context import get_client_ip

logger = logging.getLogger("app.frontend")
router = APIRouter(prefix="/client-events", tags=["client-events"])


@router.post(
    "/runtime-errors",
    response_model=ClientRuntimeErrorResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def ingest_client_runtime_error(
    payload: ClientRuntimeErrorRequest,
    request: Request,
) -> ClientRuntimeErrorResponse:
    logger.error(
        "frontend_runtime_error",
        extra=build_log_extra(
            "frontend_runtime_error",
            source=payload.source,
            route=payload.route,
            message=payload.message,
            stack=payload.stack,
            user_agent=payload.userAgent,
            source_ip=get_client_ip(request),
            metadata=payload.metadata,
        ),
    )
    return ClientRuntimeErrorResponse()
