from datetime import date, datetime, timezone
from decimal import Decimal

import pytest

from app.core.security import hash_password
from app.models.client import Client
from app.models.deconsolidation_record import DeconsolidationRecord, DeconsolidationStatus
from app.models.export_record import ExportRecord, ExportStatus
from app.models.import_record import ImportRecord, ImportStatus, Modality
from app.models.user import User, UserRole
from app.services.receipt import format_receipt_number
from app.tests.conftest import TestingSession
from app.utils.extenso import money_in_words
from app.utils.formatting import format_brl

URL = "/api/v1/receipts"
DONE_AT = datetime(2026, 10, 10, 15, 0, tzinfo=timezone.utc)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _add(obj):
    db = TestingSession()
    db.add(obj)
    db.commit()
    db.refresh(obj)
    db.expunge(obj)
    db.close()
    return obj


def _make_client(**kw) -> Client:
    data = {"name": "ISAVIX", "cnpj": "36.364.875/0001-10", "email": "fin@isavix.com.br"}
    data.update(kw)
    return _add(Client(**data))


def _make_import(client_id, **kw) -> ImportRecord:
    data = dict(
        client_id=client_id,
        reference="02526-VCH-SC-ENC",
        date=date(2026, 6, 30),
        status=ImportStatus.completed,
        modality=Modality.maritimo,
        di_duimp_dta="I2600633850",
        completed_at=DONE_AT,
    )
    data.update(kw)
    return _add(ImportRecord(**data))


def _make_export(client_id, **kw) -> ExportRecord:
    data = dict(
        client_id=client_id,
        reference="EXP-001",
        date=date(2026, 7, 1),
        status=ExportStatus.completed,
        vessel="MSC AURORA",
        services=["comex"],
        completed_at=DONE_AT,
    )
    data.update(kw)
    return _add(ExportRecord(**data))


def _make_deconsolidation(client_id, **kw) -> DeconsolidationRecord:
    data = dict(
        client_id=client_id,
        reference="DES-001",
        date=date(2026, 7, 2),
        status=DeconsolidationStatus.completed,
        master_bl="MBL123",
        house_bl="HBL456",
        services=["retirada"],
        completed_at=DONE_AT,
    )
    data.update(kw)
    return _add(DeconsolidationRecord(**data))


def _token(client, role: UserRole) -> dict:
    email = f"{role.value}@grubba.com"
    _add(User(email=email, full_name=role.value, hashed_password=hash_password("pw123456"), role=role))
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": "pw123456"})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def _payload(client_id, items, **kw) -> dict:
    data = {
        "client_id": str(client_id),
        "issue_date": "2026-10-15",
        "client_cnpj": "36.364.875/0001-10",
        "client_email": "fin@isavix.com.br",
        "client_fields": ["name", "cnpj", "email"],
        "record_fields": {"import": ["reference", "modality", "date"], "export": ["reference", "vessel"]},
        "items": items,
        "extra_costs": [],
    }
    data.update(kw)
    return data


def _item(record_type: str, record, amount) -> dict:
    return {"record_type": record_type, "record_id": str(record.id), "amount": amount}


# ---------------------------------------------------------------------------
# Formatação
# ---------------------------------------------------------------------------

def test_receipt_number_format():
    assert format_receipt_number(1, date(2026, 10, 15)) == "GT10001-26"
    assert format_receipt_number(2, date(2026, 10, 20)) == "GT10002-26"
    assert format_receipt_number(3, date(2026, 11, 1)) == "GT11003-26"  # sequência não zera no mês
    assert format_receipt_number(1000, date(2027, 1, 5)) == "GT011000-27"


def test_brl_and_words():
    assert format_brl(Decimal("1234.56")) == "R$ 1.234,56"
    assert format_brl(Decimal("128.14")) == "R$ 128,14"
    assert format_brl(Decimal("0")) == "R$ 0,00"
    assert money_in_words(Decimal("128.14")) == "cento e vinte e oito reais e quatorze centavos"
    assert money_in_words(Decimal("1500")) == "mil e quinhentos reais"
    assert money_in_words(Decimal("1.01")) == "um real e um centavo"


# ---------------------------------------------------------------------------
# Valores padrão do cliente
# ---------------------------------------------------------------------------

def test_client_default_values_admin_can_set_and_clear(client, auth_headers):
    resp = client.post(
        "/api/v1/clients", headers=auth_headers,
        json={"name": "Cliente V", "valor_padrao_importacao": "150.00"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert Decimal(data["valor_padrao_importacao"]) == Decimal("150.00")
    assert data["valor_padrao_exportacao"] is None

    resp = client.patch(
        f"/api/v1/clients/{data['id']}", headers=auth_headers, json={"valor_padrao_importacao": None}
    )
    assert resp.status_code == 200
    assert resp.json()["valor_padrao_importacao"] is None


def test_client_default_values_forbidden_for_collaborator(client):
    headers = _token(client, UserRole.collaborator)
    resp = client.post(
        "/api/v1/clients", headers=headers, json={"name": "X", "valor_padrao_exportacao": "10"}
    )
    assert resp.status_code == 403
    # sem os campos de valor, colaborador continua cadastrando normalmente
    assert client.post("/api/v1/clients", headers=headers, json={"name": "X"}).status_code == 201


# ---------------------------------------------------------------------------
# Fichas disponíveis
# ---------------------------------------------------------------------------

def test_available_records_with_default_value(client, auth_headers):
    c = _make_client(valor_padrao_importacao=Decimal("128.14"))
    imp = _make_import(c.id)
    _make_export(c.id)

    resp = client.get(f"{URL}/available-records", headers=auth_headers, params={"client_id": str(c.id)})
    assert resp.status_code == 200
    data = resp.json()
    by_type = {r["record_type"]: r for r in data["records"]}
    assert by_type["import"]["id"] == str(imp.id)
    assert Decimal(by_type["import"]["suggested_amount"]) == Decimal("128.14")
    # Sem valor padrão de exportação → campo em branco
    assert by_type["export"]["suggested_amount"] is None
    assert data["client"]["cnpj"] == "36.364.875/0001-10"
    assert {f["key"] for f in data["record_field_options"]["import"]} >= {"reference", "awb_bl", "vessel"}


def test_available_records_only_billing_pending(client, auth_headers):
    c = _make_client()
    other = _make_client(name="Outro", cnpj=None)
    ok = _make_import(c.id)
    _make_import(c.id, reference="EM-ANDAMENTO", status=ImportStatus.in_progress)
    _make_import(c.id, reference="JA-FATURADA", billing_completed=True)
    _make_import(other.id, reference="OUTRO-CLIENTE")

    resp = client.get(f"{URL}/available-records", headers=auth_headers, params={"client_id": str(c.id)})
    ids = [r["id"] for r in resp.json()["records"]]
    assert ids == [str(ok.id)]


# ---------------------------------------------------------------------------
# Criação
# ---------------------------------------------------------------------------

def test_create_receipt_multiple_records_and_total(client, auth_headers):
    c = _make_client(valor_padrao_importacao=Decimal("100"))
    imp = _make_import(c.id)
    exp = _make_export(c.id)
    des = _make_deconsolidation(c.id)

    payload = _payload(
        c.id,
        [_item("import", imp, "128.14"), _item("export", exp, "200.00"), _item("deconsolidation", des, "50.5")],
        extra_costs=[
            {"description": "Taxa de armazenagem", "amount": "30.00"},
            {"description": "Motoboy", "amount": "12.36"},
        ],
    )
    payload["total"] = "1.00"  # ignorado: o servidor recalcula
    resp = client.post(URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()

    assert data["number"] == "GT10001-26"
    assert Decimal(data["subtotal"]) == Decimal("378.64")
    assert Decimal(data["extras_total"]) == Decimal("42.36")
    assert Decimal(data["total"]) == Decimal("421.00")
    assert len(data["items"]) == 3
    assert [e["description"] for e in data["extra_costs"]] == ["Taxa de armazenagem", "Motoboy"]

    imp_item = next(i for i in data["items"] if i["record_type"] == "import")
    assert imp_item["snapshot"] == [
        {"key": "reference", "label": "Referência", "value": "02526-VCH-SC-ENC"},
        {"key": "date", "label": "Data", "value": "30/06/2026"},
        {"key": "modality", "label": "Modalidade", "value": "Marítimo"},
    ]
    assert [f["key"] for f in data["client_snapshot"]] == ["name", "cnpj", "email"]

    # Fichas marcadas com o recibo e fora das disponíveis
    resp = client.get(f"/api/v1/import-records/{imp.id}", headers=auth_headers)
    assert resp.json()["receipt"] == {"id": data["id"], "number": "GT10001-26"}
    avail = client.get(f"{URL}/available-records", headers=auth_headers, params={"client_id": str(c.id)})
    assert avail.json()["records"] == []


def test_override_amount_does_not_change_client_default(client, auth_headers):
    c = _make_client(valor_padrao_importacao=Decimal("100"))
    imp = _make_import(c.id)

    resp = client.post(URL, headers=auth_headers, json=_payload(c.id, [_item("import", imp, "250.00")]))
    assert resp.status_code == 201
    assert Decimal(resp.json()["items"][0]["amount"]) == Decimal("250.00")

    client_data = client.get(f"/api/v1/clients/{c.id}", headers=auth_headers).json()
    assert Decimal(client_data["valor_padrao_importacao"]) == Decimal("100.00")


def test_missing_amount_is_rejected(client, auth_headers):
    c = _make_client()  # sem valor padrão
    imp = _make_import(c.id)
    resp = client.post(URL, headers=auth_headers, json=_payload(c.id, [_item("import", imp, None)]))
    assert resp.status_code == 422
    assert "Informe o valor da ficha 02526-VCH-SC-ENC" in resp.json()["detail"]


def test_cnpj_email_override_only_on_receipt(client, auth_headers):
    c = _make_client()
    imp = _make_import(c.id)
    payload = _payload(c.id, [_item("import", imp, "10")], client_cnpj="00.000.000/0001-00", client_email="")
    data = client.post(URL, headers=auth_headers, json=payload).json()
    assert data["client_cnpj"] == "00.000.000/0001-00"
    assert data["client_email"] is None
    assert client.get(f"/api/v1/clients/{c.id}", headers=auth_headers).json()["cnpj"] == "36.364.875/0001-10"


def test_record_cannot_be_in_two_receipts(client, auth_headers):
    c = _make_client()
    imp = _make_import(c.id)
    assert client.post(URL, headers=auth_headers, json=_payload(c.id, [_item("import", imp, "10")])).status_code == 201
    resp = client.post(URL, headers=auth_headers, json=_payload(c.id, [_item("import", imp, "10")]))
    assert resp.status_code == 409


def test_record_from_other_client_rejected(client, auth_headers):
    c = _make_client()
    other = _make_client(name="Outro", cnpj=None)
    imp = _make_import(other.id)
    resp = client.post(URL, headers=auth_headers, json=_payload(c.id, [_item("import", imp, "10")]))
    assert resp.status_code == 422


def test_invalid_field_selection_rejected(client, auth_headers):
    c = _make_client()
    imp = _make_import(c.id)
    payload = _payload(c.id, [_item("import", imp, "10")], record_fields={"import": ["hashed_password"]})
    assert client.post(URL, headers=auth_headers, json=payload).status_code == 422


def test_snapshot_is_immutable(client, auth_headers):
    c = _make_client()
    imp = _make_import(c.id)
    data = client.post(URL, headers=auth_headers, json=_payload(c.id, [_item("import", imp, "10")])).json()

    db = TestingSession()
    db.get(ImportRecord, imp.id).reference = "ALTERADA"
    db.get(Client, c.id).name = "NOVO NOME"
    db.commit()
    db.close()

    again = client.get(f"{URL}/{data['id']}", headers=auth_headers).json()
    assert again["client_name"] == "ISAVIX"
    assert again["items"][0]["snapshot"][0]["value"] == "02526-VCH-SC-ENC"


def test_sequence_is_continuous(client, auth_headers):
    c = _make_client()
    a, b = _make_import(c.id, reference="A"), _make_import(c.id, reference="B")
    first = client.post(URL, headers=auth_headers, json=_payload(c.id, [_item("import", a, "1")])).json()
    second = client.post(
        URL, headers=auth_headers, json=_payload(c.id, [_item("import", b, "1")], issue_date="2026-11-03")
    ).json()
    assert first["number"] == "GT10001-26"
    assert second["number"] == "GT11002-26"


# ---------------------------------------------------------------------------
# Cancelamento, PDF e permissões
# ---------------------------------------------------------------------------

def test_cancel_releases_records(client, auth_headers):
    c = _make_client()
    imp = _make_import(c.id)
    data = client.post(URL, headers=auth_headers, json=_payload(c.id, [_item("import", imp, "10")])).json()

    assert client.delete(f"{URL}/{data['id']}", headers=auth_headers).status_code == 204
    assert client.get(f"{URL}/{data['id']}", headers=auth_headers).json()["is_cancelled"] is True
    assert client.delete(f"{URL}/{data['id']}", headers=auth_headers).status_code == 409

    avail = client.get(f"{URL}/available-records", headers=auth_headers, params={"client_id": str(c.id)})
    assert [r["id"] for r in avail.json()["records"]] == [str(imp.id)]
    assert client.get(f"/api/v1/import-records/{imp.id}", headers=auth_headers).json()["receipt"] is None


def test_list_receipts(client, auth_headers):
    c = _make_client()
    imp = _make_import(c.id)
    client.post(URL, headers=auth_headers, json=_payload(c.id, [_item("import", imp, "10")]))
    resp = client.get(URL, headers=auth_headers, params={"client_id": str(c.id)})
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["items_count"] == 1


def test_pdf(client, auth_headers):
    pytest.importorskip("reportlab")
    c = _make_client()
    imp = _make_import(c.id)
    data = client.post(
        URL, headers=auth_headers,
        json=_payload(c.id, [_item("import", imp, "128.14")], extra_costs=[{"description": "Taxa", "amount": "5"}]),
    ).json()
    resp = client.get(f"{URL}/{data['id']}/pdf", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content.startswith(b"%PDF")


def test_manager_allowed_collaborator_forbidden(client):
    c = _make_client()
    manager = _token(client, UserRole.manager)
    collaborator = _token(client, UserRole.collaborator)
    params = {"client_id": str(c.id)}
    assert client.get(f"{URL}/available-records", headers=manager, params=params).status_code == 200
    assert client.get(f"{URL}/available-records", headers=collaborator, params=params).status_code == 403
    assert client.get(URL, headers=collaborator).status_code == 403
