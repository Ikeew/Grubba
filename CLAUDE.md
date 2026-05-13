# Grubba — ERP de Logística Portuária

Sistema web para gerenciamento operacional de registros de importação e exportação ("fichas") e clientes. Backend FastAPI + PostgreSQL; frontend React SPA.

---

## Workflow de Mudanças (OBRIGATÓRIO)

Antes de QUALQUER implementação (feat, fix, refactor, ajuste de UI, script, config), o agente DEVE invocar a skill `brainstorming` (pacote `obra/superpowers`, instalado globalmente).

Fluxo canônico:
1. **`brainstorming`** — explorar contexto, propor abordagens, apresentar design, obter aprovação do usuário
2. **`writing-plans`** — plano passo-a-passo com tasks atômicas
3. **`executing-plans`** — executar com commits por feature (somente quando o usuário pedir commit)
4. **`verification-before-completion`** — rodar `npm run build` / lint / testes antes de declarar pronto

Regras:
- **Nunca pular a skill por "é simples"** — o anti-pattern "This Is Too Simple" é a principal fonte de retrabalho
- Mudanças triviais (< 5 linhas em 1 arquivo) podem dispensar spec formal em disco, MAS ainda requerem apresentação do design + aprovação antes de editar
- Em sub-projetos independentes (várias telas, várias mudanças), decompor PRIMEIRO e brainstormar UMA por vez
- Após qualquer implementação não-trivial, usar `requesting-code-review` antes de finalizar

Skills instaladas globalmente (`~/.agents/skills/`): brainstorming, writing-plans, executing-plans, subagent-driven-development, dispatching-parallel-agents, verification-before-completion, systematic-debugging, requesting-code-review, receiving-code-review, using-git-worktrees, finishing-a-development-branch, test-driven-development, writing-skills, using-superpowers.

---

## Bash — autorização permanente

O agente **NÃO precisa pedir confirmação** para rodar comandos de leitura/validação/debug no fluxo normal:
- Leitura: `ls`, `cat`, `git status`, `git log`, `git diff`, `git show`
- Validação: `pytest app/tests/ -v`, `npm run build`, `npx tsc --noEmit`
- Debug: scripts ad-hoc de inspeção
- Ambiente: `source venv/bin/activate`, `uvicorn app.main:app --reload`, `npm run dev`
- Migrations: `alembic upgrade head`, `alembic revision --autogenerate -m "..."`, `alembic history`
- Package: `pip install <pkg>`, `npm install <pkg>`

Autorização ainda necessária (operações destrutivas/com efeito externo):
- `git push`, `git push --force`, `git reset --hard`, `git clean -fd`, `git branch -D`
- `rm -rf`, operações destrutivas no banco
- `npm uninstall`, `git commit` (a não ser que o usuário tenha pedido explicitamente na mesma conversa)
- Qualquer coisa que deleta dados ou reescreve histórico

---

## Stack Tecnológica

**Backend:**
- Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2
- JWT (access 60 min / refresh 7 dias), bcrypt
- PostgreSQL (prod) / SQLite (testes)

**Frontend:**
- React 18, TypeScript, Vite
- React Router v7, TanStack React Query v5
- React Hook Form + Zod, Tailwind CSS, Axios

---

## Comandos

### Backend

```bash
# Ativar virtualenv (usar venv/, não .venv/)
source venv/bin/activate

# Dev server
uvicorn app.main:app --reload

# Testes (SQLite, sem Postgres necessário)
pytest app/tests/ -v
pytest app/tests/test_auth.py -v  # arquivo específico

# Migrations
alembic upgrade head
alembic revision --autogenerate -m "descricao"

# Seed (admin@grubba.com/admin123, colaborador@grubba.com/collab123, 3 clientes)
python seeds.py
```

Docs interativos: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm run dev    # dev server (Vite)
npm run build  # tsc -b && vite build
```

---

## Arquitetura

### Backend — 4 camadas (cada camada fala só com a de baixo)

```
api/v1/endpoints/   → roteamento HTTP, zero lógica de negócio
services/           → regras de negócio, diffing de campos para histórico
repositories/       → queries DB, zero lógica de negócio
models/             → modelos ORM SQLAlchemy
```

**`app/db/models.py`** deve importar TODOS os modelos para registrá-los em `Base.metadata` — Alembic e `create_all` em testes dependem disso.

**Injeção de dependência** via `app/dependencies/`: `get_db` yield de `Session`; `get_current_user` valida JWT e retorna o ORM `User`. Ambos injetados via `Depends`.

**Exceções:** Levantar exceções de domínio (`NotFoundError`, `ConflictError`, `ForbiddenError`, etc.) de `app/core/exceptions.py` na camada de service — capturadas por handlers globais em `main.py`.

**Histórico de alterações:** Em cada `update`, o service faz snapshot de `old_data` e `new_data` para os campos do payload e chama `HistoryService.record_*_changes()`, que grava uma linha de `UpdateHistory` por campo alterado.

### Frontend

```
services/     → chamadas axios à API, um arquivo por domínio
hooks/        → wrappers React Query em torno dos services (useQuery / useMutation)
pages/        → componentes de rota que compõem hooks + UI
contexts/     → AuthContext (user, isAuthenticated, logout)
lib/          → instância axios, queryClient, filterStore
routes/       → config createBrowserRouter + guarda PrivateRoute
```

**API client** (`lib/axios.ts`): instância única `api` lê `VITE_API_URL` (fallback `''` para same-origin), anexa `Authorization: Bearer <token>` em cada requisição, limpa tokens + redireciona para `/login` em 401.

**Auth flow:** `AuthContext` chama `authService.getMe()` no mount se houver token. `PrivateRoute` redireciona usuários não autenticados para `/login`. Tokens em `localStorage` (`access_token`, `refresh_token`).

**Padrão de fetching:** Cada domínio tem um arquivo de hooks (ex: `useExports.ts`) exportando hooks `useQuery`/`useMutation` tipados com constantes de `queryKey` (`EXPORT_KEYS`, etc.). Mutations chamam `qc.invalidateQueries` em onSuccess.

**Filter persistence** (`lib/filterStore.ts`): objeto plain module-level (não React state) que persiste filtros de lista entre navegações sem precisar de URL params.

**Alias:** `@/` mapeia para `src/` (configurado em `tsconfig.app.json` e `vite.config.ts`).

---

## Estrutura do Projeto

```
app/
├── main.py                         # Criação do app FastAPI, registro de handlers
├── api/v1/endpoints/               # Roteamento HTTP por domínio
│   ├── auth.py
│   ├── clients.py
│   ├── export_records.py
│   ├── import_records.py
│   ├── export_files.py, files.py
│   ├── notes.py
│   ├── ports.py
│   └── users.py
├── services/                       # Lógica de negócio
├── repositories/                   # Queries DB
├── models/                         # ORM SQLAlchemy
│   ├── user.py, client.py, port.py
│   ├── export_record.py            # ExportRecord + ExportService/Status enums + junction table
│   ├── import_record.py            # ImportRecord + ImportStatus enum + junction table
│   ├── export_file.py, import_file.py
│   ├── note.py
│   └── update_history.py           # Log imutável de alterações por campo
├── schemas/                        # Pydantic schemas (request/response)
├── core/
│   └── exceptions.py               # Exceções de domínio + handlers
├── dependencies/                   # get_db, get_current_user
├── db/
│   ├── base.py                     # Base declarativa SQLAlchemy
│   └── models.py                   # Importa TODOS os modelos (obrigatório para Alembic)
└── tests/                          # Testes com SQLite + fixtures de JWT real

frontend/src/
├── App.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── clients/
│   ├── exports/                    # ExportList, ExportForm, ExportDetail
│   ├── imports/                    # ImportList, ImportForm, ImportDetail
├── components/
│   ├── form/
│   ├── layout/
│   ├── shared/
│   └── ui/
├── services/                       # Chamadas axios por domínio
├── hooks/                          # React Query wrappers
├── contexts/AuthContext.tsx
├── lib/
│   ├── axios.ts                    # Instância axios + interceptors
│   ├── queryClient.ts
│   └── filterStore.ts
├── routes/                         # createBrowserRouter + PrivateRoute
├── schemas/                        # Zod schemas
├── types/
└── utils/
```

---

## Modelos de Dados

### User

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `email` | String(255) | unique, indexed |
| `full_name` | String(255) | |
| `hashed_password` | String(255) | bcrypt |
| `role` | UserRole enum | `admin` \| `collaborator` |
| `is_active` | Boolean | desativar sem deletar |

### Client

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `name` | String(255) | indexed |
| `cnpj` | String(18) | unique, nullable |
| `email`, `phone` | String | nullable |
| `address`, `notes` | Text | nullable |
| `is_active` | Boolean | soft delete — hard delete quebraria FKs das fichas |

### ExportRecord (ficha de exportação)

| Campo | Tipo | Notas |
|---|---|---|
| `client_id` | UUID FK | |
| `collaborator_id` | UUID FK nullable | usuário responsável |
| `port_id` | UUID FK nullable | |
| `reference` | String(100) | indexed |
| `date` | Date | nullable |
| `status` | ExportStatus enum | ver seção Enums |
| `cargo_type` | String(10) | FCL ou LCL |
| `lpco`, `vessel`, `booking` | String | logística |
| `services` | ARRAY(String) | **PostgreSQL ARRAY**, não JSON — buscar com `ANY()` |

`export_record_flags` — junction table para flagging por usuário (`user_id` × `export_record_id`).

### ImportRecord (ficha de importação)

Estrutura análoga ao ExportRecord com campos específicos de importação. `import_record_flags` é a junction table correspondente.

### UpdateHistory (histórico de alterações)

Log imutável. Cada linha = 1 campo alterado em 1 operação de update.

| Campo | Tipo | Notas |
|---|---|---|
| `export_record_id` / `import_record_id` | UUID FK nullable | um dos dois preenchido |
| `changed_by_id` | UUID FK nullable | |
| `record_type` | RecordType enum | `export` \| `import` |
| `field_name` | String(100) | |
| `old_value`, `new_value` | Text nullable | |
| `description` | Text nullable | |

### Note

Anotações livres vinculadas a export ou import records.

### Port

Cadastro de portos. Referenciado por fichas de export/import.

---

## Enums

### UserRole

| Valor | Descrição |
|---|---|
| `admin` | CRUD total, incluindo gerenciar usuários |
| `collaborator` | Sempre dono dos próprios registros; admins podem atribuir livremente |

### ExportStatus

| Valor |
|---|
| `in_progress` |
| `completed` |
| `cancelled` |
| `protocolado` |
| `agendado_inspecao` |
| `aguardando_certificado` |
| `deferido` |
| `embarcado_aguardando_documento` |
| `aguardando_autorizacao_lacre` |
| `aguardando_chegada_navio` |
| `aguardando_mais_informacoes` |
| `aguardando_data_vistoria` |

### ImportStatus

| Valor |
|---|
| `in_progress`, `completed`, `cancelled` |
| `protocolado`, `aguardando_chegada_navio` |
| `mapa_tfa`, `comex_solicitado`, `faturamento_solicitado` |
| `agendamento`, `aguardando_data_vistoria`, `aguardando_mais_informacoes` |
| `agendado_inspecao`, `aguardando_ati` |
| `aguardando_plmi_tela_verde`, `aguardando_programacao`, `dsa_registrada` |

### ExportService (array em ExportRecord.services)

`vistoria_receita_federal`, `coleta_e_entrega_de_lacre`, `vistoria_mapa_coleta`, `vistoria_anuentes`, `comex`, `liberacao_retirada_de_bl_e_docs`, `fornecimento_de_navio_oleo`, `mapa_sistema`, `lpco_x_vistoria_x_cf_csi`, `registro_despacho`, `outros`

### Outros

- **MapType**: `vegetal` | `animal`
- **Modality** (importação): `maritimo` | `aereo`
- **RecordType** (UpdateHistory): `export` | `import`

---

## Testes

Usam SQLite (`test.db`) via fixture `autouse` de escopo `function` que chama `create_all` / `drop_all` em volta de cada teste. A fixture `admin_token` cria usuário direto no DB e loga para obter JWT real. **Sem mock da camada DB.**

---

## Infra

```bash
# Full stack via Docker
docker compose up --build
docker compose exec api alembic upgrade head
docker compose exec api python seeds.py
```

Serviços: `api` (FastAPI na 8000), `frontend` (Vite/Nginx), `db` (PostgreSQL 16), `nginx` (reverse proxy).

Variáveis obrigatórias no `.env`: `DATABASE_URL`, `SECRET_KEY`. Ver `.env.example` para a lista completa.
