from datetime import datetime

from sqlalchemy.orm import Session

from app.models.user import LoginAttempt, RefreshToken, User


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def get_by_username(self, username: str) -> User | None:
        return self.db.query(User).filter(User.username == username).first()

    def get_by_id(self, user_id: str) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        return user

    def save_user(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        return user

    def list_users(self, skip: int = 0, limit: int = 50) -> list[User]:
        return self.db.query(User).offset(skip).limit(limit).all()

    def count_users(self) -> int:
        return self.db.query(User).count()

    def add_refresh_token(self, refresh_token: RefreshToken) -> RefreshToken:
        self.db.add(refresh_token)
        self.db.flush()
        return refresh_token

    def add_login_attempt(self, login_attempt: LoginAttempt) -> LoginAttempt:
        self.db.add(login_attempt)
        self.db.flush()
        return login_attempt

    def get_refresh_token_by_hash(self, token_hash: str) -> RefreshToken | None:
        return self.db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()

    def get_refresh_token_by_hash_for_update(self, token_hash: str) -> RefreshToken | None:
        return (
            self.db.query(RefreshToken)
            .filter(RefreshToken.token_hash == token_hash)
            .with_for_update()
            .first()
        )

    def revoke_refresh_token(
        self,
        refresh_token: RefreshToken,
        revoked_at: datetime,
    ) -> RefreshToken:
        refresh_token.revoked_at = revoked_at
        self.db.add(refresh_token)
        self.db.flush()
        return refresh_token

    def revoke_all_refresh_tokens_for_user(self, user_id: str, revoked_at: datetime) -> int:
        tokens = (
            self.db.query(RefreshToken)
            .filter(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
            )
            .all()
        )

        for token in tokens:
            token.revoked_at = revoked_at
            self.db.add(token)

        self.db.flush()
        return len(tokens)

    def delete_expired_refresh_tokens(self, now: datetime) -> int:
        tokens = self.db.query(RefreshToken).filter(RefreshToken.expires_at < now).all()
        count = len(tokens)
        for token in tokens:
            self.db.delete(token)
        self.db.flush()
        return count

    def delete_old_revoked_refresh_tokens(self, older_than: datetime) -> int:
        tokens = (
            self.db.query(RefreshToken)
            .filter(
                RefreshToken.revoked_at.is_not(None),
                RefreshToken.revoked_at < older_than,
            )
            .all()
        )
        count = len(tokens)
        for token in tokens:
            self.db.delete(token)
        self.db.flush()
        return count
