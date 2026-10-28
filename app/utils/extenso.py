"""Valor monetário por extenso em português (ex.: 128,14 -> 'cento e vinte e oito reais e quatorze centavos')."""
from decimal import Decimal

from app.utils.formatting import to_money

_UNITS = (
    "zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
    "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove",
)
_TENS = ("", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa")
_HUNDREDS = (
    "", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos",
    "seiscentos", "setecentos", "oitocentos", "novecentos",
)
# (singular, plural) por grupo de milhar
_SCALES = (("", ""), ("mil", "mil"), ("milhão", "milhões"), ("bilhão", "bilhões"))


def _below_thousand(n: int) -> str:
    if n == 100:
        return "cem"
    parts = []
    hundreds, rest = divmod(n, 100)
    if hundreds:
        parts.append(_HUNDREDS[hundreds])
    if rest:
        if rest < 20:
            parts.append(_UNITS[rest])
        else:
            tens, units = divmod(rest, 10)
            parts.append(_TENS[tens] + (f" e {_UNITS[units]}" if units else ""))
    return " e ".join(parts)


def _integer_words(n: int) -> str:
    if n == 0:
        return "zero"
    groups = []
    while n:
        n, g = divmod(n, 1000)
        groups.append(g)

    words: list[tuple[int, str]] = []
    for idx in range(len(groups) - 1, -1, -1):
        g = groups[idx]
        if not g:
            continue
        singular, plural = _SCALES[idx]
        if idx == 1:
            text = "mil" if g == 1 else f"{_below_thousand(g)} mil"
        elif idx >= 2:
            text = f"{_below_thousand(g)} {singular if g == 1 else plural}"
        else:
            text = _below_thousand(g)
        words.append((g, text))

    # Conector "e" antes do último grupo quando ele é < 100 ou centena exata (ex.: "mil e cem")
    result = words[0][1]
    for g, text in words[1:]:
        connector = " e " if (g < 100 or g % 100 == 0) else " "
        result += connector + text
    return result


def money_in_words(value: Decimal | int | float | str) -> str:
    amount = to_money(value)
    reais = int(amount)
    centavos = int((amount - reais) * 100)

    parts = []
    if reais:
        unit = "real" if reais == 1 else "reais"
        # "um milhão de reais", "dois milhões de reais"
        if reais >= 1_000_000 and reais % 1_000_000 == 0:
            unit = f"de {unit}"
        parts.append(f"{_integer_words(reais)} {unit}")
    if centavos:
        parts.append(f"{_integer_words(centavos)} {'centavo' if centavos == 1 else 'centavos'}")
    return " e ".join(parts) if parts else "zero real"
