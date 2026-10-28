"""Geração do PDF do recibo (reportlab).

Usa exclusivamente os dados gravados no recibo (snapshots), nunca a ficha/cliente atuais.
"""
from io import BytesIO
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from xml.sax.saxutils import escape

from app.models.receipt import Receipt
from app.utils.extenso import money_in_words
from app.utils.formatting import format_brl, format_date_br

LOGO_PATH = Path(__file__).resolve().parent.parent / "assets" / "logo-grubba.jpg"
COMPANY_NAME = "Grubba Logística e Terceirizações Aduaneiras"
CITY = "São Francisco do Sul"

# Paleta da logo
BLUE = colors.HexColor("#1D4F91")
GREEN = colors.HexColor("#1E8E3E")
INK = colors.HexColor("#1F2937")
MUTED = colors.HexColor("#6B7280")
LINE = colors.HexColor("#E5E7EB")
ZEBRA = colors.HexColor("#F8FAFC")

SECTION_TITLES = {
    "import": "Importação",
    "export": "Exportação",
    "deconsolidation": "Desconsolidação",
}

MONTHS = (
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
)

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm
CONTENT_W = PAGE_W - 2 * MARGIN
VALUE_COL_W = 30 * mm


def _style(name: str, **kw) -> ParagraphStyle:
    base = {"fontName": "Helvetica", "fontSize": 9, "leading": 12, "textColor": INK}
    base.update(kw)
    return ParagraphStyle(name, **base)


S_LABEL = _style("label", fontSize=7.5, leading=10, textColor=MUTED)
S_BODY = _style("body")
S_BODY_BOLD = _style("body_bold", fontName="Helvetica-Bold")
S_CELL = _style("cell", fontSize=8.5, leading=11)
S_CELL_HEAD = _style("cell_head", fontName="Helvetica-Bold", fontSize=7.5, leading=10, textColor=MUTED)
S_CELL_RIGHT = _style("cell_right", fontSize=8.5, leading=11, alignment=TA_RIGHT)
S_HEAD_RIGHT = _style("head_right", fontName="Helvetica-Bold", fontSize=7.5, leading=10,
                      textColor=MUTED, alignment=TA_RIGHT)
S_SECTION = _style("section", fontName="Helvetica-Bold", fontSize=10, leading=14, textColor=BLUE)
S_TITLE = _style("title", fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=GREEN,
                 alignment=TA_RIGHT)
S_NUMBER = _style("number", fontName="Helvetica-Bold", fontSize=18, leading=22, textColor=BLUE,
                  alignment=TA_RIGHT)
S_META = _style("meta", fontSize=9, leading=12, textColor=MUTED, alignment=TA_RIGHT)
S_CLIENT_NAME = _style("client_name", fontName="Helvetica-Bold", fontSize=12, leading=15)
S_DECLARATION = _style("declaration", fontSize=9.5, leading=14, alignment=TA_LEFT)
S_CENTER = _style("center", alignment=1)
S_CENTER_BOLD = _style("center_bold", fontName="Helvetica-Bold", alignment=1)


def _p(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(escape(text or "—"), style)


def _header(receipt: Receipt) -> Table:
    logo_h = 24 * mm
    logo = Image(str(LOGO_PATH), width=logo_h * 380 / 358, height=logo_h)
    right = [
        _p("RECIBO", S_TITLE),
        _p(f"Nº {receipt.number}", S_NUMBER),
        _p(f"Emitido em {format_date_br(receipt.issue_date)}", S_META),
    ]
    table = Table([[logo, right]], colWidths=[CONTENT_W * 0.5, CONTENT_W * 0.5])
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("LINEBELOW", (0, 0), (-1, 0), 1.5, GREEN),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
    ]))
    return table


def _client_box(receipt: Receipt) -> Table:
    rows = [r for r in receipt.client_snapshot if r["key"] != "name" and r["value"]]
    cells: list[list] = [[_p("RECEBEMOS DE", S_LABEL)], [_p(receipt.client_name, S_CLIENT_NAME)]]

    # Campos do cliente em duas colunas (rótulo pequeno acima do valor)
    pairs = [[_p(r["label"].upper(), S_LABEL), _p(r["value"], S_BODY)] for r in rows]
    if pairs:
        grid = []
        for i in range(0, len(pairs), 2):
            left = pairs[i]
            right = pairs[i + 1] if i + 1 < len(pairs) else ["", ""]
            grid.append([left[0], right[0]])
            grid.append([left[1], right[1]])
        inner = Table(grid, colWidths=[(CONTENT_W - 12 * mm) / 2] * 2)
        inner_style = [
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]
        # Respiro acima de cada linha de rótulos (exceto a primeira)
        for row in range(2, len(grid), 2):
            inner_style.append(("TOPPADDING", (0, row), (-1, row), 6))
        inner.setStyle(TableStyle(inner_style))
        cells.append([inner])

    box = Table(cells, colWidths=[CONTENT_W])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ZEBRA),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("LINEBEFORE", (0, 0), (0, -1), 3, BLUE),
        ("LEFTPADDING", (0, 0), (-1, -1), 6 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6 * mm),
        ("TOPPADDING", (0, 0), (-1, 0), 5 * mm),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 5 * mm),
    ]))
    return box


def _data_table(header: list, rows: list[list], col_widths: list[float]) -> Table:
    table = Table([header, *rows], colWidths=col_widths, repeatRows=1)
    style = [
        ("LINEBELOW", (0, 0), (-1, 0), 0.8, BLUE),
        ("LINEBELOW", (0, 1), (-1, -1), 0.3, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]
    for i in range(1, len(rows) + 1):
        if i % 2 == 0:
            style.append(("BACKGROUND", (0, i), (-1, i), ZEBRA))
    table.setStyle(TableStyle(style))
    return table


def _items_sections(receipt: Receipt) -> list:
    flow: list = []
    for record_type, title in SECTION_TITLES.items():
        items = [i for i in receipt.items if i.record_type == record_type]
        if not items:
            continue

        # Colunas = campos escolhidos (ordem do snapshot); sem campos, mostra a referência
        columns = [(f["key"], f["label"]) for f in items[0].snapshot] or [("reference", "Referência")]
        table_values = []
        for item in items:
            values = {f["key"]: f["value"] for f in item.snapshot}
            if not item.snapshot:
                values["reference"] = item.reference or ""
            table_values.append(values)

        # Largura proporcional ao conteúdo de cada coluna, para não quebrar números longos à toa
        weights = [
            min(max(len(label), *(len(v.get(key, "")) for v in table_values), 6), 40)
            for key, label in columns
        ]
        text_w = CONTENT_W - VALUE_COL_W
        widths = [text_w * w / sum(weights) for w in weights]

        header = [_p(label.upper(), S_CELL_HEAD) for _, label in columns] + [_p("VALOR", S_HEAD_RIGHT)]
        rows = [
            [_p(values.get(key, ""), S_CELL) for key, _ in columns]
            + [_p(format_brl(item.amount), S_CELL_RIGHT)]
            for item, values in zip(items, table_values)
        ]

        flow.append(_p(f"{title}  ·  {len(items)} {'ficha' if len(items) == 1 else 'fichas'}", S_SECTION))
        flow.append(Spacer(1, 2 * mm))
        flow.append(_data_table(header, rows, widths + [VALUE_COL_W]))
        flow.append(Spacer(1, 5 * mm))
    return flow


def _extras_section(receipt: Receipt) -> list:
    if not receipt.extra_costs:
        return []
    header = [_p("DESCRIÇÃO", S_CELL_HEAD), _p("VALOR", S_HEAD_RIGHT)]
    rows = [[_p(e.description, S_CELL), _p(format_brl(e.amount), S_CELL_RIGHT)] for e in receipt.extra_costs]
    return [
        _p("Custos adicionais", S_SECTION),
        Spacer(1, 2 * mm),
        _data_table(header, rows, [CONTENT_W - VALUE_COL_W, VALUE_COL_W]),
        Spacer(1, 5 * mm),
    ]


def _totals(receipt: Receipt) -> Table:
    label_w, value_w = 45 * mm, 38 * mm
    rows = [
        [_p("Subtotal das fichas", S_META), _p(format_brl(receipt.subtotal), S_CELL_RIGHT)],
    ]
    if receipt.extra_costs:
        rows.append([_p("Custos adicionais", S_META), _p(format_brl(receipt.extras_total), S_CELL_RIGHT)])
    total_label = _style("total_label", fontName="Helvetica-Bold", fontSize=10, textColor=colors.white,
                         alignment=TA_RIGHT)
    total_value = _style("total_value", fontName="Helvetica-Bold", fontSize=14, leading=17,
                         textColor=colors.white, alignment=TA_RIGHT)
    rows.append([_p("TOTAL", total_label), _p(format_brl(receipt.total), total_value)])

    spacer_w = CONTENT_W - label_w - value_w
    table = Table([["", *r] for r in rows], colWidths=[spacer_w, label_w, value_w])
    last = len(rows) - 1
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (1, last), (2, last), BLUE),
        ("TOPPADDING", (1, last), (2, last), 7),
        ("BOTTOMPADDING", (1, last), (2, last), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def _declaration(receipt: Receipt) -> Paragraph:
    n = len(receipt.items)
    text = (
        f"Recebemos de <b>{escape(receipt.client_name)}</b> a importância de "
        f"<b>{format_brl(receipt.total)}</b> ({escape(money_in_words(receipt.total))}), "
        f"referente a {n} {'processo' if n == 1 else 'processos'} discriminado{'' if n == 1 else 's'} acima. "
        "Sendo verdade, damos plena e rasa quitação, após comprovação."
    )
    return Paragraph(text, S_DECLARATION)


def _closing(receipt: Receipt) -> KeepTogether:
    """Declaração + local/data + assinatura, mantidos juntos na mesma página."""
    d = receipt.issue_date
    place_date = f"{CITY}, {d.day} de {MONTHS[d.month - 1]} de {d.year}."
    line = Table([[""]], colWidths=[85 * mm], rowHeights=[14 * mm])
    line.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.6, INK)]))
    line.hAlign = "CENTER"
    return KeepTogether([
        _declaration(receipt),
        Spacer(1, 8 * mm),
        _p(place_date, S_CENTER),
        line,
        Spacer(1, 1.5 * mm),
        _p(COMPANY_NAME, S_CENTER_BOLD),
    ])


def _page_decorations(receipt: Receipt):
    def draw(canvas, doc) -> None:
        canvas.saveState()
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(MARGIN, 10 * mm, f"{COMPANY_NAME}  ·  Recibo {receipt.number}")
        canvas.drawRightString(PAGE_W - MARGIN, 10 * mm, f"Página {doc.page}")
        if receipt.is_cancelled:
            canvas.setFillColor(colors.Color(0.86, 0.15, 0.15, alpha=0.18))
            canvas.setFont("Helvetica-Bold", 90)
            canvas.translate(PAGE_W / 2, PAGE_H / 2)
            canvas.rotate(35)
            canvas.drawCentredString(0, 0, "CANCELADO")
        canvas.restoreState()

    return draw


def render_receipt_pdf(receipt: Receipt) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN + 4 * mm,
        title=f"Recibo {receipt.number}",
        author=COMPANY_NAME,
    )
    story: list = [
        _header(receipt),
        Spacer(1, 6 * mm),
        _client_box(receipt),
        Spacer(1, 7 * mm),
        *_items_sections(receipt),
        *_extras_section(receipt),
        _totals(receipt),
        Spacer(1, 8 * mm),
        _closing(receipt),
    ]
    decorate = _page_decorations(receipt)
    doc.build(story, onFirstPage=decorate, onLaterPages=decorate)
    return buffer.getvalue()
