"""Catálogo dos campos que podem aparecer no recibo.

Montado a partir dos campos que já existem nos models de cada tipo de ficha e do cliente.
O backend é a fonte única: o front recebe esta lista via API e o snapshot do recibo é gerado aqui.
"""
from dataclasses import dataclass
from datetime import date, datetime
from enum import Enum
from typing import Any, Callable

from app.utils.formatting import format_date_br

_ENUM_LABELS: dict[str, str] = {
    # Modality (importação)
    "maritimo": "Marítimo",
    "aereo": "Aéreo",
    # DeconsolidationModality
    "importacao": "Importação",
    "exportacao": "Exportação",
    # MapType
    "vegetal": "Vegetal",
    "animal": "Animal",
}

_SERVICE_LABELS: dict[str, str] = {
    # ExportService
    "vistoria_receita_federal": "Vistoria Receita Federal",
    "coleta_e_entrega_de_lacre": "Coleta e Entrega de Lacre",
    "vistoria_mapa_coleta": "Vistoria MAPA/Coleta",
    "vistoria_anuentes": "Vistoria Anuentes",
    "comex": "Comex",
    "liberacao_retirada_de_bl_e_docs": "Liberação/Retirada de BL e Docs",
    "fornecimento_de_navio_oleo": "Fornecimento de Navio/Óleo",
    "mapa_sistema": "MAPA Sistema",
    "lpco_x_vistoria_x_cf_csi": "LPCO × Vistoria × CF/CSI",
    "registro_despacho": "Registro/Despacho",
    "outros": "Outros",
    # DeconsolidationService
    "retirada": "Retirada",
    "liberacao": "Liberação",
}


def _format_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (date, datetime)):
        return format_date_br(value)
    if isinstance(value, Enum):
        value = value.value
    if isinstance(value, bool):
        return "Sim" if value else "Não"
    if isinstance(value, (list, tuple)):
        return ", ".join(_SERVICE_LABELS.get(v, v) for v in value)
    value = str(value)
    return _ENUM_LABELS.get(value, value)


@dataclass(frozen=True)
class FieldDef:
    key: str
    label: str
    getter: Callable[[Any], Any] | None = None  # padrão: getattr(obj, key)

    def extract(self, obj: Any) -> str:
        raw = self.getter(obj) if self.getter else getattr(obj, self.key, None)
        return _format_value(raw)


def _port_name(record: Any) -> str | None:
    return record.port.name if getattr(record, "port", None) else None


IMPORT_FIELDS: tuple[FieldDef, ...] = (
    FieldDef("reference", "Referência"),
    FieldDef("date", "Data"),
    FieldDef("modality", "Modalidade"),
    FieldDef("cargo_type", "Tipo de Carga"),
    FieldDef("importer", "Importador"),
    FieldDef("ce_mercante", "CE Mercante"),
    FieldDef("awb_bl", "AWB/BL"),
    FieldDef("di_duimp_dta", "DI/DUIMP/DTA"),
    FieldDef("numero_li", "Número LI"),
    FieldDef("dta", "DTA"),
    FieldDef("dtc", "DTC"),
    FieldDef("shipping_company", "Armador"),
    FieldDef("vessel", "Navio"),
    FieldDef("port", "Porto", _port_name),
    FieldDef("eta", "ETA"),
    FieldDef("etb", "ETB"),
    FieldDef("containers", "Contêineres"),
    FieldDef("carrier", "Transportadora"),
    FieldDef("local_ioa", "Local IOA"),
    FieldDef("inspection_date", "Data de Vistoria"),
    FieldDef("lpco_packaging", "LPCO Embalagem"),
    FieldDef("lpco_number", "Número LPCO"),
    FieldDef("map_type", "Tipo de Mapa"),
    FieldDef("selected_unit", "Unidade Selecionada"),
    FieldDef("cargo_presence_date", "Data Presença de Carga"),
    FieldDef("released_at", "Liberado em"),
    FieldDef("comex_informed_date", "Data Informação Comex"),
    FieldDef("completed_at", "Concluído em"),
    FieldDef("observations", "Observações"),
)

EXPORT_FIELDS: tuple[FieldDef, ...] = (
    FieldDef("reference", "Referência"),
    FieldDef("date", "Data"),
    FieldDef("cargo_type", "Tipo de Carga"),
    FieldDef("exporter", "Exportador"),
    FieldDef("lpco", "LPCO"),
    FieldDef("vessel", "Navio"),
    FieldDef("booking", "Booking"),
    FieldDef("due_25br", "DUE"),
    FieldDef("shipping_company", "Armador"),
    FieldDef("port", "Porto", _port_name),
    FieldDef("eta", "ETA"),
    FieldDef("etb", "ETB"),
    FieldDef("ets", "ETS"),
    FieldDef("et5", "ET5"),
    FieldDef("ddl_carga", "DDL Carga"),
    FieldDef("services", "Serviços"),
    FieldDef("map_type", "Tipo de Mapa"),
    FieldDef("selected_unit", "Unidade Selecionada"),
    FieldDef("new_seal", "Novo Lacre"),
    FieldDef("inspection_date", "Data de Vistoria"),
    FieldDef("comex_released_date", "Data Liberação Comex"),
    FieldDef("completed_at", "Concluído em"),
    FieldDef("observations", "Observações"),
)

DECONSOLIDATION_FIELDS: tuple[FieldDef, ...] = (
    FieldDef("reference", "Referência"),
    FieldDef("date", "Data"),
    FieldDef("modality", "Modalidade"),
    FieldDef("consignee", "Consignatário"),
    FieldDef("services", "Serviços"),
    FieldDef("ce_mercante", "CE Mercante"),
    FieldDef("master_bl", "AWB/BL Master"),
    FieldDef("house_bl", "AWB/BL House"),
    FieldDef("agency", "Agência"),
    FieldDef("shipping_company", "Armador"),
    FieldDef("completed_at", "Concluído em"),
    FieldDef("observations", "Observações"),
)

CLIENT_FIELDS: tuple[FieldDef, ...] = (
    FieldDef("name", "Razão social"),
    FieldDef("cnpj", "CNPJ"),
    FieldDef("email", "E-mail"),
    FieldDef("phone", "Telefone"),
    FieldDef("address", "Endereço"),
)

RECORD_FIELDS: dict[str, tuple[FieldDef, ...]] = {
    "import": IMPORT_FIELDS,
    "export": EXPORT_FIELDS,
    "deconsolidation": DECONSOLIDATION_FIELDS,
}

# Seleção inicial sugerida na tela de montagem
DEFAULT_RECORD_FIELDS: dict[str, list[str]] = {
    "import": ["reference", "modality", "date", "awb_bl", "di_duimp_dta"],
    "export": ["reference", "date", "vessel", "booking", "due_25br"],
    "deconsolidation": ["reference", "date", "master_bl", "house_bl"],
}
DEFAULT_CLIENT_FIELDS: list[str] = ["name", "cnpj", "email"]


def valid_keys(fields: tuple[FieldDef, ...]) -> set[str]:
    return {f.key for f in fields}


def build_snapshot(obj: Any, fields: tuple[FieldDef, ...], selected: list[str]) -> list[dict[str, str]]:
    """Lista ordenada (na ordem do catálogo) de {key, label, value} dos campos escolhidos."""
    chosen = set(selected)
    return [
        {"key": f.key, "label": f.label, "value": f.extract(obj)}
        for f in fields
        if f.key in chosen
    ]
