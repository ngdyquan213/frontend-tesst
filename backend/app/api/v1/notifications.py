from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import build_notification_service, get_current_user
from app.core.database import get_db
from app.schemas.notification import NotificationItemResponse, NotificationListResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotificationListResponse:
    service = build_notification_service(db)
    items = service.list_user_notifications(current_user=current_user)
    return NotificationListResponse(items=items)


@router.post(
    "/{notification_id}/read",
    response_model=NotificationItemResponse,
    status_code=status.HTTP_200_OK,
)
def mark_notification_read(
    notification_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotificationItemResponse:
    service = build_notification_service(db)
    return NotificationItemResponse(
        **service.mark_notification_read(
            current_user=current_user,
            notification_id=notification_id,
        )
    )


@router.post("/read-all", response_model=NotificationListResponse)
def mark_all_notifications_read(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotificationListResponse:
    service = build_notification_service(db)
    items = service.mark_all_notifications_read(current_user=current_user)
    return NotificationListResponse(items=items)
