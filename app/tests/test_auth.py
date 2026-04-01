def test_login_success(client, admin_token):
    assert admin_token is not None


def test_login_invalid_credentials(client):
    resp = client.post("/api/v1/auth/login", json={"email": "wrong@test.com", "password": "bad"})
    assert resp.status_code == 401


def test_get_me(client, auth_headers):
    resp = client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "admin@grubba.com"


def test_get_me_no_token(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 403
