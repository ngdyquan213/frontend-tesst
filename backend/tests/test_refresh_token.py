def test_login_returns_refresh_token(client, db_session):
    register_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "refresh1@example.com",
            "username": "refresh1",
            "full_name": "Refresh User 1",
            "password": "Password123",
        },
    )
    assert register_resp.status_code == 201

    login_resp = client.post(
        "/api/v1/auth/login",
        json={
            "email": "refresh1@example.com",
            "password": "Password123",
        },
    )
    assert login_resp.status_code == 200

    body = login_resp.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


def test_refresh_returns_new_access_token(client, db_session):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "refresh2@example.com",
            "username": "refresh2",
            "full_name": "Refresh User 2",
            "password": "Password123",
        },
    )

    login_resp = client.post(
        "/api/v1/auth/login",
        json={
            "email": "refresh2@example.com",
            "password": "Password123",
        },
    )
    assert login_resp.status_code == 200
    refresh_token = login_resp.json()["refresh_token"]

    refresh_resp = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_resp.status_code == 200
    body = refresh_resp.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["refresh_token"] != refresh_token


def test_logout_revokes_refresh_token(client, db_session):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "refresh3@example.com",
            "username": "refresh3",
            "full_name": "Refresh User 3",
            "password": "Password123",
        },
    )

    login_resp = client.post(
        "/api/v1/auth/login",
        json={
            "email": "refresh3@example.com",
            "password": "Password123",
        },
    )
    refresh_token = login_resp.json()["refresh_token"]

    logout_resp = client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refresh_token},
    )
    assert logout_resp.status_code == 200

    refresh_resp = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_resp.status_code == 401


def test_logout_all_revokes_all_tokens(client, db_session):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "refresh4@example.com",
            "username": "refresh4",
            "full_name": "Refresh User 4",
            "password": "Password123",
        },
    )

    login_resp1 = client.post(
        "/api/v1/auth/login",
        json={
            "email": "refresh4@example.com",
            "password": "Password123",
        },
    )
    login_resp2 = client.post(
        "/api/v1/auth/login",
        json={
            "email": "refresh4@example.com",
            "password": "Password123",
        },
    )

    access_token = login_resp1.json()["access_token"]
    refresh_token1 = login_resp1.json()["refresh_token"]
    refresh_token2 = login_resp2.json()["refresh_token"]

    logout_all_resp = client.post(
        "/api/v1/auth/logout-all",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert logout_all_resp.status_code == 200

    refresh_resp1 = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token1},
    )
    refresh_resp2 = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token2},
    )

    assert refresh_resp1.status_code == 401
    assert refresh_resp2.status_code == 401
