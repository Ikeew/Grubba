"""Formatação no padrão brasileiro (independente do locale do sistema)."""
from datetime import date, datetime, timedelta, timezone
from decimal import ROUND_HALF_UP, Decimal

# Brasil (Brasília) não tem horário de verão desde 2019 — offset fixo evita depender de tzdata
BRT = timezone(timedelta(hours=-3))

CENTS = Decimal("0.01")


def to_money(value: Decimal | int | float | str) -> Decimal:
    return Decimal(str(value)).quantize(CENTS, rounding=ROUND_HALF_UP)


def format_brl(value: Decimal | int | float | str) -> str:
    """Decimal('1234.5') -> 'R$ 1.234,50'."""
    amount = to_money(value)
    sign = "-" if amount < 0 else ""
    integer, cents = f"{abs(amount):.2f}".split(".")
    groups = []
    while integer:
        groups.insert(0, integer[-3:])
        integer = integer[:-3]
    return f"{sign}R$ {'.'.join(groups)},{cents}"


def format_date_br(value: date | datetime | None) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        if value.tzinfo is not None:
            value = value.astimezone(BRT)
        value = value.date()
    return value.strftime("%d/%m/%Y")
