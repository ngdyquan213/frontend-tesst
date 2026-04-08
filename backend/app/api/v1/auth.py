from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.deps import build_auth_service, get_current_user
from app.core.database import get_db
from app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserMeResponse,
)
from app.utils.enums import enum_to_str
from app.utils.request_context import get_client_ip, get_user_agent

router = APIRouter(prefix="/auth", tags=["auth"])
TOKEN_TYPE_BEARER = "bearer"  # nosec B105


@router.post("/register", response_model=UserMeResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> UserMeResponse:
    service = build_auth_service(db)

    user = service.register(
        payload=payload,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return UserMeResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        status=enum_to_str(user.status),
        email_verified=user.email_verified,
        created_at=user.created_at,
    )


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> TokenResponse:
    service = build_auth_service(db)

    _, access_token, refresh_token = service.login(
        payload=payload,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type=TOKEN_TYPE_BEARER,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_access_token(
    payload: RefreshTokenRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> TokenResponse:
    service = build_auth_service(db)

    _, access_token, new_refresh_token = service.refresh_access_token(
        refresh_token=payload.refresh_token,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type=TOKEN_TYPE_BEARER,
    )


@router.post("/logout", response_model=MessageResponse)
def logout(
    payload: LogoutRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> MessageResponse:
    service = build_auth_service(db)

    service.logout(
        refresh_token=payload.refresh_token,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return MessageResponse(message="Logged out successfully")


@router.post("/logout-all", response_model=MessageResponse)
def logout_all(
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    service = build_auth_service(db)

    service.logout_all(
        user_id=str(current_user.id),
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return MessageResponse(message="Logged out from all sessions successfully")
