from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import build_user_service, get_current_user
from app.core.database import get_db
from app.schemas.user import UserResponse
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import user_to_dict

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_me(
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    service = build_user_service(db)
    user = service.get_my_profile(
        current_user=current_user,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    return UserResponse(**user_to_dict(user))
