# Grubba — ERP de Logística Portuária (Backend)

Backend do sistema de controle de clientes e fichas operacionais de importação/exportação.

---

## Stack

| Camada       | Tecnologia                     |
|--------------|--------------------------------|
| Linguagem    | Python 3.12+                   |
| API          | FastAPI                        |
| ORM          | SQLAlchemy 2.0                 |
| Migrations   | Alembic                        |
| Banco        | PostgreSQL 16                  |
| Validação    | Pydantic v2                    |
| Autenticação | JWT (access + refresh tokens)  |
| Senhas       | bcrypt via passlib              |
| Containers   | Docker + Docker Compose        |

---

## Estrutura do projeto

```
app/
├── main.py                  # Entrypoint FastAPI
├── core/
│   ├── config.py            # Settings via pydantic-settings (.env)
│   ├── security.py          # JWT e hash de senhas
│   └── exceptions.py        # Exceções de domínio + handlers globais
├── db/
│   ├── session.py           # Engine e SessionLocal
│   └── base.py              # Base declarativa + importação dos modelos
├── models/                  # Modelos SQLAlchemy (entidades do banco)
├── schemas/                 # Schemas Pydantic (request/response)
├── repositories/            # Acesso ao banco (queries, sem regra de negócio)
├── services/                # Regras de negócio (sem HTTP aqui)
├── api/v1/endpoints/        # Rotas FastAPI (sem lógica aqui)
├── dependencies/            # Injeção de dependências (auth, db session)
├── utils/                   # Paginação e utilitários gerais
└── tests/                   # Testes com pytest + httpx
alembic/                     # Migrations
uploads/                     # Arquivos enviados (gitignored em produção)
seeds.py                     # Dados iniciais para desenvolvimento
```

---

## Como rodar localmente (sem Docker)

### 1. Pré-requisitos

- Python 3.12+
- PostgreSQL 16 rodando localmente

### 2. Configurar ambiente

```bash
cd Grubba
python -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

pip install -r requirements.txt
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite .env com suas credenciais do PostgreSQL
```

Exemplo mínimo de `.env`:
```env
DATABASE_URL=postgresql://grubba_user:grubba_pass@localhost:5432/grubba_db
SECRET_KEY=sua-chave-secreta-muito-longa-e-aleatoria-minimo-32-chars
```

### 4. Criar banco de dados

```sql
-- No psql ou pgAdmin:
CREATE DATABASE grubba_db;
CREATE USER grubba_user WITH PASSWORD 'grubba_pass';
GRANT ALL PRIVILEGES ON DATABASE grubba_db TO grubba_user;
```

### 5. Rodar migrations

```bash
alembic upgrade head
```

### 6. Rodar seeds (dados iniciais)

```bash
python seeds.py
```

Isso criará:
- `admin@grubba.com` / `admin123` (role: admin)
- `colaborador@grubba.com` / `collab123` (role: collaborator)
- 3 clientes de exemplo

### 7. Iniciar o servidor

```bash
uvicorn app.main:app --reload
```

Acesse a documentação interativa: http://localhost:8000/docs

---

## Como rodar com Docker

```bash
cp .env.example .env
# Ajuste a SECRET_KEY no .env

docker compose up --build
```

Rode as migrations e seeds após o boot:

```bash
docker compose exec api alembic upgrade head
docker compose exec api python seeds.py
```

---

## Como rodar testes

```bash
pytest app/tests/ -v
```

Os testes usam SQLite e não exigem PostgreSQL rodando.

---

## Gerar nova migration

Após alterar um modelo:

```bash
alembic revision --autogenerate -m "descricao da mudanca"
alembic upgrade head
```

---

## Endpoints principais

### Autenticação

| Método | Endpoint               | Descrição                        |
|--------|------------------------|----------------------------------|
| POST   | `/api/v1/auth/login`   | Login com email e senha          |
| POST   | `/api/v1/auth/refresh` | Renova o access token            |
| GET    | `/api/v1/auth/me`      | Perfil do usuário autenticado    |

### Usuários *(admin)*

| Método | Endpoint                            | Descrição               |
|--------|-------------------------------------|-------------------------|
| POST   | `/api/v1/users`                     | Criar usuário           |
| GET    | `/api/v1/users`                     | Listar usuários         |
| GET    | `/api/v1/users/{id}`                | Buscar por ID           |
| PATCH  | `/api/v1/users/{id}`                | Atualizar               |
| POST   | `/api/v1/users/me/change-password`  | Trocar própria senha    |
| DELETE | `/api/v1/users/{id}`                | Desativar usuário       |

### Clientes

| Método | Endpoint                        | Descrição                   |
|--------|---------------------------------|-----------------------------|
| POST   | `/api/v1/clients`               | Criar cliente               |
| GET    | `/api/v1/clients?search=...`    | Listar / buscar clientes    |
| GET    | `/api/v1/clients/{id}`          | Buscar por ID               |
| PATCH  | `/api/v1/clients/{id}`          | Atualizar                   |
| DELETE | `/api/v1/clients/{id}`          | Desativar (soft delete)     |

### Fichas de Exportação

| Método | Endpoint                                    | Descrição            |
|--------|---------------------------------------------|----------------------|
| POST   | `/api/v1/export-records`                    | Criar ficha          |
| GET    | `/api/v1/export-records?client_id=&status=` | Listar com filtros   |
| GET    | `/api/v1/export-records/{id}`               | Buscar por ID        |
| PATCH  | `/api/v1/export-records/{id}`               | Atualizar            |
| DELETE | `/api/v1/export-records/{id}`               | Remover              |
| GET    | `/api/v1/export-records/{id}/history`       | Histórico de changes |

### Fichas de Importação

| Método | Endpoint                                    | Descrição            |
|--------|---------------------------------------------|----------------------|
| POST   | `/api/v1/import-records`                    | Criar ficha          |
| GET    | `/api/v1/import-records?client_id=&status=` | Listar com filtros   |
| GET    | `/api/v1/import-records/{id}`               | Buscar por ID        |
| PATCH  | `/api/v1/import-records/{id}`               | Atualizar            |
| DELETE | `/api/v1/import-records/{id}`               | Remover              |
| GET    | `/api/v1/import-records/{id}/history`       | Histórico de changes |

### Arquivos (vinculados à importação)

| Método | Endpoint                                 | Descrição                 |
|--------|------------------------------------------|---------------------------|
| POST   | `/api/v1/import-records/{id}/files`      | Upload de arquivo         |
| GET    | `/api/v1/import-records/{id}/files`      | Listar arquivos da ficha  |
| DELETE | `/api/v1/import-records/files/{file_id}` | Remover arquivo           |

### Observações (Notes)

| Método | Endpoint                              | Descrição                          |
|--------|---------------------------------------|------------------------------------|
| POST   | `/api/v1/notes`                       | Criar nota (export ou import)      |
| GET    | `/api/v1/export-records/{id}/notes`   | Notas de uma ficha de exportação   |
| GET    | `/api/v1/import-records/{id}/notes`   | Notas de uma ficha de importação   |
| PATCH  | `/api/v1/notes/{id}`                  | Editar nota (somente autor/admin)  |
| DELETE | `/api/v1/notes/{id}`                  | Remover nota (somente autor/admin) |

---

## Autenticação e perfis

- Todos os endpoints (exceto `/auth/login`) requerem `Authorization: Bearer <access_token>`
- Access token expira em 60 min (via `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`)
- Refresh token expira em 7 dias (via `JWT_REFRESH_TOKEN_EXPIRE_DAYS`)
- Perfis: `admin` e `collaborator`
- Criação e listagem de usuários requerem perfil `admin`

---

## Decisões de modelagem

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Colaborador nas fichas | FK para `User` | Rastreabilidade, relatórios por usuário, notificações futuras |
| Serviços da exportação | `ARRAY(String)` PostgreSQL | Consultas nativas com `ANY()`, sem custo de deserialização JSON |
| Histórico de mudanças | Diff campo a campo na service layer | Granularidade máxima; cada campo alterado tem seu próprio registro |
| Soft delete nos clientes | `is_active = False` | Preserva integridade referencial das fichas vinculadas |
| Notas | Tabela única com FK opcional | Evita duplicação; preparado para novos tipos de registro |
| Status das fichas | Enum: `draft`, `in_progress`, `completed`, `cancelled` | Validação automática pelo banco, semântica clara |
