from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import build_user_service, get_current_user
from app.core.database import get_db
from app.schemas.auth import ChangePasswordRequest, MessageResponse
from app.schemas.user import UserResponse, UserUpdateRequest
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


@router.put("/me", response_model=UserResponse)
def update_me(
    payload: UserUpdateRequest,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    service = build_user_service(db)
    user = service.update_my_profile(
        current_user=current_user,
        full_name=payload.full_name,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    return UserResponse(**user_to_dict(user))


@router.post("/me/change-password", response_model=MessageResponse)
def change_my_password(
    payload: ChangePasswordRequest,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    service = build_user_service(db)
    service.change_my_password(
        current_user=current_user,
        current_password=payload.current_password,
        new_password=payload.new_password,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    return MessageResponse(message="Password changed successfully")
