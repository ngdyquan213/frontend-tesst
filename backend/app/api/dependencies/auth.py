from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import AuthenticationAppException, AuthorizationAppException
from app.core.security import decode_access_token
from app.models.enums import UserStatus
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise AuthenticationAppException("Invalid authentication credentials") from exc

    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationAppException("Invalid authentication credentials")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise AuthenticationAppException("User not found")
    if user.status != UserStatus.active:
        raise AuthenticationAppException("User is not active")

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    role_names = [user_role.role.name for user_role in current_user.roles]
    if "admin" not in role_names:
        raise AuthorizationAppException("Admin access required")
    return current_user


def require_permission(permission_name: str):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        role_names = {user_role.role.name for user_role in current_user.roles}
        permissions = {
            role_permission.permission.name
            for user_role in current_user.roles
            for role_permission in user_role.role.role_permissions
        }

        # Backward compatibility for legacy admin roles created before explicit permissions existed.
        if "admin" in role_names and not permissions:
            return current_user

        if permission_name in permissions:
            return current_user

        if permissions:
            raise AuthorizationAppException(f"Missing permission: {permission_name}")

        raise AuthorizationAppException("Admin access required")

    return dependency
