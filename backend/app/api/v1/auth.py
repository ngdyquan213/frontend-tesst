from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import build_auth_service, get_current_user
from app.core.database import get_db
from app.core.exceptions import AuthenticationAppException
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshTokenRequest,
    RegisterRequest,
    ResendVerificationEmailRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserMeResponse,
    VerifyEmailRequest,
)
from app.utils.auth_cookies import (
    clear_auth_cookies,
    get_refresh_token_from_request,
    set_auth_cookies,
)
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import user_to_dict

router = APIRouter(prefix="/auth", tags=["auth"])
TOKEN_TYPE_BEARER = "bearer"  # nosec B105
TOKEN_RESPONSE_MODE_HEADER = "X-Token-Response-Mode"
TOKEN_RESPONSE_MODE_BODY = "body"


def _should_include_tokens_in_body(request: Request) -> bool:
    return request.headers.get(TOKEN_RESPONSE_MODE_HEADER, "").strip().lower() == (
        TOKEN_RESPONSE_MODE_BODY
    )


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

    return UserMeResponse(**user_to_dict(user))


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
) -> TokenResponse:
    service = build_auth_service(db)

    user, access_token, refresh_token = service.login(
        payload=payload,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    set_auth_cookies(response, access_token=access_token, refresh_token=refresh_token)

    include_tokens_in_body = _should_include_tokens_in_body(request)
    return TokenResponse(
        access_token=access_token if include_tokens_in_body else None,
        refresh_token=refresh_token if include_tokens_in_body else None,
        token_type=TOKEN_TYPE_BEARER,
        user=UserMeResponse(**user_to_dict(user)),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_access_token(
    request: Request,
    response: Response,
    payload: RefreshTokenRequest | None = None,
    db: Session = Depends(get_db),
) -> TokenResponse:
    service = build_auth_service(db)
    refresh_token = (
        payload.refresh_token
        if payload and payload.refresh_token
        else get_refresh_token_from_request(request)
    )
    if not refresh_token:
        raise AuthenticationAppException("Refresh token is required")

    user, access_token, new_refresh_token = service.refresh_access_token(
        refresh_token=refresh_token,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    set_auth_cookies(response, access_token=access_token, refresh_token=new_refresh_token)

    include_tokens_in_body = _should_include_tokens_in_body(request)
    return TokenResponse(
        access_token=access_token if include_tokens_in_body else None,
        refresh_token=new_refresh_token if include_tokens_in_body else None,
        token_type=TOKEN_TYPE_BEARER,
        user=UserMeResponse(**user_to_dict(user)),
    )


@router.post("/logout", response_model=MessageResponse)
def logout(
    request: Request,
    response: Response,
    payload: LogoutRequest | None = None,
    db: Session = Depends(get_db),
) -> MessageResponse:
    service = build_auth_service(db)
    refresh_token = (
        payload.refresh_token
        if payload and payload.refresh_token
        else get_refresh_token_from_request(request)
    )
    if not refresh_token:
        raise AuthenticationAppException("Refresh token is required")

    service.logout(
        refresh_token=refresh_token,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    clear_auth_cookies(response)

    return MessageResponse(message="Logged out successfully")


@router.post("/logout-all", response_model=MessageResponse)
def logout_all(
    response: Response,
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
    clear_auth_cookies(response)

    return MessageResponse(message="Logged out from all sessions successfully")


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> MessageResponse:
    service = build_auth_service(db)
    service.forgot_password(
        email=payload.email,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    return MessageResponse(message="If the account exists, reset instructions have been sent")


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> MessageResponse:
    service = build_auth_service(db)
    service.reset_password(
        token=payload.token,
        new_password=payload.password,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    return MessageResponse(message="Password reset successfully")


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(
    payload: VerifyEmailRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> MessageResponse:
    service = build_auth_service(db)
    service.verify_email(
        token=payload.token,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    return MessageResponse(message="Email verified successfully")


@router.post("/verify-email/resend", response_model=MessageResponse)
def resend_verification_email(
    payload: ResendVerificationEmailRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> MessageResponse:
    service = build_auth_service(db)
    service.resend_email_verification(
        email=payload.email,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    return MessageResponse(
        message="If the account exists, verification instructions have been sent"
    )
