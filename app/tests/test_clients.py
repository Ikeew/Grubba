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


def test_list_clients_beyond_first_page_is_searchable(client, auth_headers):
    # Cria mais clientes do que cabem em uma página do seletor
    for i in range(120):
        client.post("/api/v1/clients", headers=auth_headers, json={"name": f"Cliente Lote {i:03d}"})
    client.post("/api/v1/clients", headers=auth_headers, json={"name": "Zeta Cargas Ltda"})

    resp = client.get("/api/v1/clients", headers=auth_headers, params={"page_size": 50, "search": "zeta"})
    assert resp.status_code == 200
    names = [c["name"] for c in resp.json()["items"]]
    assert "Zeta Cargas Ltda" in names


def test_list_clients_is_ordered_and_pages_do_not_overlap(client, auth_headers):
    for name in ["Charlie", "Alpha", "Bravo", "Delta"]:
        client.post("/api/v1/clients", headers=auth_headers, json={"name": f"Ord {name}"})

    p1 = client.get("/api/v1/clients", headers=auth_headers, params={"search": "Ord ", "page_size": 2, "page": 1}).json()
    p2 = client.get("/api/v1/clients", headers=auth_headers, params={"search": "Ord ", "page_size": 2, "page": 2}).json()
    names = [c["name"] for c in p1["items"] + p2["items"]]
    assert names == ["Ord Alpha", "Ord Bravo", "Ord Charlie", "Ord Delta"]


def test_search_ignores_inactive_clients(client, auth_headers):
    created = client.post("/api/v1/clients", headers=auth_headers, json={"name": "Inativo Teste"}).json()
    client.delete(f"/api/v1/clients/{created['id']}", headers=auth_headers)

    resp = client.get("/api/v1/clients", headers=auth_headers, params={"search": "Inativo Teste"})
    assert resp.json()["total"] == 0
