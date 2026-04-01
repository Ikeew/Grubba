def test_create_client(client, auth_headers):
    resp = client.post(
        "/api/v1/clients",
        headers=auth_headers,
        json={"name": "Empresa Teste Ltda", "cnpj": "12.345.678/0001-99"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Empresa Teste Ltda"
    assert data["cnpj"] == "12.345.678/0001-99"


def test_create_client_duplicate_cnpj(client, auth_headers):
    payload = {"name": "Empresa A", "cnpj": "11.111.111/0001-11"}
    client.post("/api/v1/clients", headers=auth_headers, json=payload)
    resp = client.post("/api/v1/clients", headers=auth_headers, json={"name": "Empresa B", "cnpj": "11.111.111/0001-11"})
    assert resp.status_code == 409


def test_list_clients(client, auth_headers):
    client.post("/api/v1/clients", headers=auth_headers, json={"name": "Cliente X"})
    resp = client.get("/api/v1/clients", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


def test_get_client_not_found(client, auth_headers):
    resp = client.get("/api/v1/clients/00000000-0000-0000-0000-000000000000", headers=auth_headers)
    assert resp.status_code == 404
