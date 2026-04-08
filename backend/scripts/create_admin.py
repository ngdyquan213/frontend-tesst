from __future__ import annotations

import argparse

from sqlalchemy.orm import Session

from app.core.constants import ALL_ADMIN_PERMISSIONS
from app.core.database import SessionLocal
from app.core.rbac import ensure_role_has_permissions
from app.core.security import get_password_hash
from app.models.enums import UserStatus
from app.models.role import Role, UserRole
from app.models.user import User


def create_or_update_admin(
    db: Session,
    *,
    email: str,
    password: str,
    username: str = "admin",
    full_name: str = "System Admin",
) -> User:
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(name="admin", description="Administrator")
        db.add(admin_role)
        db.flush()

    ensure_role_has_permissions(
        db,
        role=admin_role,
        permission_names=ALL_ADMIN_PERMISSIONS,
    )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            username=username,
            full_name=full_name,
            password_hash=get_password_hash(password),
            status=UserStatus.active,
            email_verified=True,
            phone_verified=False,
            failed_login_count=0,
        )
        db.add(user)
        db.flush()
    else:
        user.username = username
        user.full_name = full_name
        user.password_hash = get_password_hash(password)
        user.status = UserStatus.active
        user.email_verified = True

    existing_mapping = (
        db.query(UserRole)
        .filter(UserRole.user_id == user.id, UserRole.role_id == admin_role.id)
        .first()
    )
    if not existing_mapping:
        db.add(UserRole(user_id=user.id, role_id=admin_role.id))
        db.flush()

    return user


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create or update an admin user.")
    parser.add_argument("--email", default="admin@example.com")
    parser.add_argument("--password", default="Admin12345")
    parser.add_argument("--username", default="admin")
    parser.add_argument("--full-name", default="System Admin")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    db: Session = SessionLocal()

    try:
        with db.begin():
            create_or_update_admin(
                db,
                email=args.email,
                password=args.password,
                username=args.username,
                full_name=args.full_name,
            )

        print("Admin user created/updated successfully.")
        print(f"email={args.email}")
        print(f"password={args.password}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
