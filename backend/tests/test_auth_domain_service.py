from app.services.auth_domain_service import AuthDomainService


def test_registered_user_starts_unverified():
    service = AuthDomainService(max_failed_logins=5, lockout_minutes=15)

    user = service.build_registered_user(
        email="traveler@example.com",
        username="traveler",
        full_name="Traveler Example",
        password_hash="hashed-password",
    )

    assert user.email_verified is False
    assert user.phone_verified is False
