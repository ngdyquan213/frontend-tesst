from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationAppException, ConflictAppException
from app.core.security import get_password_hash, verify_password
from app.models.enums import LogActorType, SecurityEventType
from app.models.user import LoginAttempt, User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.audit_service import AuditService
from app.services.auth_domain_service import AuthDomainService
from app.services.auth_token_service import AuthTokenService
from app.services.outbox_service import OutboxService
from app.utils.ip_utils import normalize_ip
from app.workers.email_worker import EmailWorker


class AuthService:
    def __init__(
        self,
        db: Session,
        user_repo: UserRepository,
        audit_service: AuditService,
        email_worker: EmailWorker,
        auth_token_service: AuthTokenService,
        domain_service: AuthDomainService,
        outbox_service: OutboxService | None = None,
    ) -> None:
        self.db = db
        self.user_repo = user_repo
        self.audit_service = audit_service
        self.email_worker = email_worker
        self.auth_token_service = auth_token_service
        self.domain_service = domain_service
        self.outbox_service = outbox_service or OutboxService(
            db=db,
            email_worker=email_worker,
        )

    @staticmethod
    def _raise_registration_conflict(exc: IntegrityError) -> None:
        constraint_name = getattr(getattr(exc.orig, "diag", None), "constraint_name", None)
        error_message = str(exc.orig).lower()

        if constraint_name == "users_email_key" or "key (email)=" in error_message:
            raise ConflictAppException("Email already registered") from exc

        if constraint_name == "users_username_key" or "key (username)=" in error_message:
            raise ConflictAppException("Username already taken") from exc

    def register(
        self,
        *,
        payload: RegisterRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> User:
        normalized_ip = normalize_ip(ip_address)

        existing_email = self.user_repo.get_by_email(payload.email)
        existing_username = self.user_repo.get_by_username(payload.username)
        self.domain_service.assert_registration_available(
            existing_email=existing_email,
            existing_username=existing_username,
        )

        try:
            user = self.domain_service.build_registered_user(
                email=payload.email,
                username=payload.username,
                full_name=payload.full_name,
                password_hash=get_password_hash(payload.password),
            )
            self.user_repo.create_user(user)

            self.db.flush()

            self.audit_service.log_action(
                actor_type=LogActorType.user,
                actor_user_id=user.id,
                action="user_registered",
                resource_type="user",
                resource_id=user.id,
                ip_address=normalized_ip,
                user_agent=user_agent,
                metadata={"email": user.email},
            )

            self.outbox_service.enqueue_email(
                handler="send_welcome_email",
                kwargs={
                    "to_email": user.email,
                    "full_name": user.full_name,
                },
            )

            self.db.commit()
            self.db.refresh(user)

        except IntegrityError as exc:
            self.db.rollback()
            self._raise_registration_conflict(exc)
            raise
        except Exception:
            self.db.rollback()
            raise

        self.db.refresh(user)
        return user

    def _record_login_attempt(
        self,
        *,
        email: str,
        success: bool,
        ip_address: str | None,
        user_agent: str | None,
    ) -> None:
        self.user_repo.add_login_attempt(
            LoginAttempt(
                email=email,
                ip_address=ip_address,
                user_agent=user_agent,
                success=success,
            )
        )

    def login(
        self,
        *,
        payload: LoginRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[User, str, str]:
        normalized_ip = normalize_ip(ip_address)
        user = self.user_repo.get_by_email(payload.email)
        now = datetime.now(timezone.utc)
        locked_until = self.domain_service.get_active_lockout_until(user=user, now=now)

        if user and locked_until:
            try:
                self._record_login_attempt(
                    email=payload.email,
                    success=False,
                    ip_address=normalized_ip,
                    user_agent=user_agent,
                )
                self.audit_service.log_security_event(
                    event_type=SecurityEventType.auth,
                    severity="high",
                    title="Locked account login attempt",
                    description="Login attempted while account lockout is active",
                    related_user_id=user.id,
                    ip_address=normalized_ip,
                    event_data={
                        "email": payload.email,
                        "locked_until": locked_until.isoformat(),
                    },
                )
                self.db.commit()
            except Exception:
                self.db.rollback()
                raise

            raise AuthenticationAppException("Account is temporarily locked")

        if not user or not verify_password(payload.password, user.password_hash):
            try:
                lockout_applied = False
                if user:
                    result = self.domain_service.apply_failed_login(user=user, now=now)
                    lockout_applied = result.lockout_applied
                    self.user_repo.save_user(user)

                self._record_login_attempt(
                    email=payload.email,
                    success=False,
                    ip_address=normalized_ip,
                    user_agent=user_agent,
                )
                self.audit_service.log_security_event(
                    event_type=SecurityEventType.auth,
                    severity="medium",
                    title="Login failed",
                    description="Invalid email or password",
                    ip_address=normalized_ip,
                    related_user_id=user.id if user else None,
                    event_data={
                        "email": payload.email,
                        "failed_login_count": user.failed_login_count if user else None,
                        "lockout_applied": lockout_applied,
                    },
                )
                if user and lockout_applied and user.locked_until:
                    self.audit_service.log_security_event(
                        event_type=SecurityEventType.auth,
                        severity="high",
                        title="Account temporarily locked",
                        description="Account lockout threshold reached after repeated failures",
                        related_user_id=user.id,
                        ip_address=normalized_ip,
                        event_data={
                            "email": payload.email,
                            "failed_login_count": user.failed_login_count,
                            "locked_until": user.locked_until.isoformat(),
                        },
                    )
                self.db.commit()
            except Exception:
                self.db.rollback()
                raise

            raise AuthenticationAppException("Invalid email or password")

        try:
            self.domain_service.apply_successful_login(
                user=user,
                now=now,
                ip_address=normalized_ip,
            )
            self.user_repo.save_user(user)
            self._record_login_attempt(
                email=payload.email,
                success=True,
                ip_address=normalized_ip,
                user_agent=user_agent,
            )

            access_token, refresh_token = self.auth_token_service.issue_session_tokens(
                user_id=str(user.id),
                ip_address=normalized_ip,
                user_agent=user_agent,
            )

            self.audit_service.log_action(
                actor_type=LogActorType.user,
                actor_user_id=user.id,
                action="user_logged_in",
                resource_type="user",
                resource_id=user.id,
                ip_address=normalized_ip,
                user_agent=user_agent,
                metadata={"email": user.email},
            )

            self.db.commit()
            return user, access_token, refresh_token

        except Exception:
            self.db.rollback()
            raise

    def refresh_access_token(
        self,
        *,
        refresh_token: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[User, str, str]:
        normalized_ip = normalize_ip(ip_address)

        try:
            stored = self.auth_token_service.validate_refresh_token(
                refresh_token=refresh_token,
                lock_for_update=True,
            )

            user = self.user_repo.get_by_id(str(stored.user_id))
            self.domain_service.assert_user_is_active(user)

            old_token, access_token, new_refresh_token = (
                self.auth_token_service.rotate_refresh_token(
                    refresh_token=refresh_token,
                    user_id=str(user.id),
                    ip_address=normalized_ip,
                    user_agent=user_agent,
                    stored_token=stored,
                )
            )

            self.audit_service.log_action(
                actor_type=LogActorType.user,
                actor_user_id=user.id,
                action="access_token_refreshed",
                resource_type="refresh_token",
                resource_id=old_token.id,
                ip_address=normalized_ip,
                user_agent=user_agent,
                metadata={"user_id": str(user.id), "rotation": True},
            )

            self.db.commit()
            return user, access_token, new_refresh_token

        except ValueError as exc:
            self.db.rollback()
            raise AuthenticationAppException(str(exc)) from exc
        except Exception:
            self.db.rollback()
            raise

    def logout(
        self,
        *,
        refresh_token: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        normalized_ip = normalize_ip(ip_address)

        try:
            stored = self.auth_token_service.validate_refresh_token(refresh_token=refresh_token)
        except ValueError as exc:
            raise AuthenticationAppException(str(exc)) from exc

        try:
            self.user_repo.revoke_refresh_token(
                stored,
                revoked_at=datetime.now(timezone.utc),
            )

            self.audit_service.log_action(
                actor_type=LogActorType.user,
                actor_user_id=stored.user_id,
                action="user_logged_out",
                resource_type="refresh_token",
                resource_id=stored.id,
                ip_address=normalized_ip,
                user_agent=user_agent,
                metadata={"user_id": str(stored.user_id)},
            )

            self.db.commit()

        except Exception:
            self.db.rollback()
            raise

    def logout_all(
        self,
        *,
        user_id: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> int:
        normalized_ip = normalize_ip(ip_address)

        try:
            count = self.user_repo.revoke_all_refresh_tokens_for_user(
                user_id=user_id,
                revoked_at=datetime.now(timezone.utc),
            )

            self.audit_service.log_action(
                actor_type=LogActorType.user,
                actor_user_id=user_id,
                action="user_logged_out_all_sessions",
                resource_type="refresh_token",
                ip_address=normalized_ip,
                user_agent=user_agent,
                metadata={"revoked_count": count},
            )

            self.db.commit()
            return count

        except Exception:
            self.db.rollback()
            raise
