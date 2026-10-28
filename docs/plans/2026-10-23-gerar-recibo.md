# Plano — Gerar Recibo (Faturamento)

## Decisões aprovadas
- Recibos (gerar, listar, baixar, cancelar) e valores padrão no cliente: **somente admin e manager**.
- Fichas elegíveis: as que aparecem no Faturamento (`status = completed`, `billing_completed = false`) e sem recibo ativo.
- Dados do cliente no recibo: só `name` (+ CNPJ, e-mail, telefone, endereço).
- Ao gerar, cada ficha fica marcada com o recibo (`receipt_id`); continua no Faturamento com selo
  "Recibo gerado" + download. "Marcar faturado" segue independente.
- Número: `GT{MM}{seq:03d}-{AA}` — MM/AA da data de emissão, sequência global contínua (nunca zera),
  começando em 001.
- Cancelar = soft delete (`is_cancelled`), libera as fichas (`receipt_id = NULL`), número não é reaproveitado.

## Tasks
1. Fix SQLite em testes: `ARRAY(String).with_variant(JSON, "sqlite")` nos 2 models com `services`.
2. Cliente: 3 colunas `Numeric(12,2)` + schemas + bloqueio para collaborator no service.
3. Models `Receipt`, `ReceiptItem`, `ReceiptExtraCost` + `receipt_id` nas 3 tabelas de fichas + `db/models.py`.
4. Migration `r7a8b9c0d1e2`.
5. `receipt_fields.py` (catálogo de campos por tipo, rótulos PT, formatadores).
6. Repository + service (validação, total no servidor, snapshot, numeração) + `require_billing_access`.
7. PDF (reportlab) + logo em `app/assets/logo-grubba.jpg`.
8. Endpoints `/api/v1/receipts` + `receipt` resumido nas respostas das fichas.
9. Testes `app/tests/test_receipts.py`.
10. Front: tipos/serviço/hooks, ClientForm, botões no Faturamento, página de montagem, lista de recibos,
    Faturamento visível para manager.
11. `npm run build`.
