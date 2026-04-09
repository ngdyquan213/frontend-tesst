from types import SimpleNamespace

import pytest

from app.core.exceptions import ValidationAppException
from app.core.security import get_password_hash
from app.services.user_service import UserService


def test_get_my_profile_returns_current_user_without_committing():
    db = SimpleNamespace()
    audit_service = SimpleNamespace()
    service = UserService(db=db, audit_service=audit_service, user_repo=SimpleNamespace())
    current_user = SimpleNamespace(id="user-1")

    result = service.get_my_profile(current_user=current_user)

    assert result is current_user


def test_change_my_password_rejects_weak_password_before_writing():
    class FakeUserRepo:
        def __init__(self):
            self.saved = False

        def save_user(self, _user):
            self.saved = True

        def revoke_all_refresh_tokens_for_user(self, *, user_id, revoked_at):
            return 0

    db = SimpleNamespace(commit=lambda: None, rollback=lambda: None)
    audit_service = SimpleNamespace(log_action=lambda **kwargs: None)
    user_repo = FakeUserRepo()
    service = UserService(db=db, audit_service=audit_service, user_repo=user_repo)
    current_user = SimpleNamespace(
        id="user-1",
        password_hash=get_password_hash("Password123"),
    )

    with pytest.raises(ValidationAppException, match="uppercase"):
        service.change_my_password(
            current_user=current_user,
            current_password="Password123",
            new_password="weakpassword1",
        )

    assert user_repo.saved is False
