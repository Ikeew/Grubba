# Grubba — Frontend

Interface web do sistema ERP de logística portuária.

## Stack

| Camada        | Tecnologia                  |
|---------------|-----------------------------|
| Framework     | React 18 + TypeScript       |
| Build         | Vite 6                      |
| Roteamento    | React Router v7             |
| Formulários   | React Hook Form + Zod       |
| HTTP          | Axios                       |
| Server state  | TanStack Query v5           |
| Estilização   | Tailwind CSS v3             |

---

## Como rodar

### 1. Pré-requisito: backend rodando

```bash
# Na raiz do projeto
uvicorn app.main:app --reload
# Backend disponível em http://localhost:8000
```

### 2. Instalar dependências

```bash
cd frontend
npm install
```

### 3. Configurar ambiente

```bash
cp .env.example .env
# VITE_API_URL=http://localhost:8000 (já é o padrão)
```

### 4. Iniciar o frontend

```bash
npm run dev
# Disponível em http://localhost:5173
```

> O Vite já tem proxy configurado: requisições para `/api` são redirecionadas para `http://localhost:8000`.

---

## Estrutura

```
src/
├── lib/
│   ├── axios.ts          # Client HTTP com interceptors de auth
│   └── queryClient.ts    # Configuração global do TanStack Query
├── types/                # Interfaces TypeScript (espelho dos contratos da API)
├── schemas/              # Schemas Zod para validação dos formulários
├── services/             # Funções de chamada à API por domínio
├── hooks/                # Hooks TanStack Query por domínio
├── contexts/
│   └── AuthContext.tsx   # Estado de autenticação global
├── layouts/
│   ├── AppLayout.tsx     # Sidebar + Header
│   └── AuthLayout.tsx    # Layout centralizado para login
├── components/
│   ├── ui/               # Primitivos: Button, Input, Select, Textarea, Badge, Spinner
│   ├── layout/           # Sidebar, Header, PageHeader
│   └── shared/           # Pagination, SearchInput, StatusBadge, ConfirmModal, EmptyState
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── clients/          # ClientList, ClientForm
│   ├── exports/          # ExportList, ExportForm, ExportDetail
│   └── imports/          # ImportList, ImportForm, ImportDetail
├── routes/
│   ├── index.tsx         # Definição de todas as rotas
│   └── PrivateRoute.tsx  # Guard de autenticação
└── utils/
    ├── format.ts         # Formatação de datas, tamanhos, nomes de campos
    └── constants.ts      # Labels e cores dos status, enums
```

---

## Fluxo de autenticação

1. `AuthContext` verifica `localStorage` ao inicializar
2. Se token presente, chama `/auth/me` para hidratar o usuário
3. `PrivateRoute` redireciona para `/login` se não autenticado
4. O interceptor Axios do `lib/axios.ts` injeta o token em todas as requisições
5. Em caso de 401, limpa os tokens e redireciona para `/login`

---

## Páginas disponíveis

| Rota                    | Página                               |
|-------------------------|--------------------------------------|
| `/login`                | Login                                |
| `/dashboard`            | Dashboard com contadores             |
| `/clients`              | Listagem de clientes                 |
| `/clients/new`          | Cadastro de cliente                  |
| `/clients/:id/edit`     | Edição de cliente                    |
| `/exports`              | Listagem de fichas de exportação     |
| `/exports/new`          | Nova ficha de exportação             |
| `/exports/:id`          | Detalhe (com notas e histórico)      |
| `/exports/:id/edit`     | Edição de ficha de exportação        |
| `/imports`              | Listagem de fichas de importação     |
| `/imports/new`          | Nova ficha de importação             |
| `/imports/:id`          | Detalhe (com arquivos, notas, histórico) |
| `/imports/:id/edit`     | Edição de ficha de importação        |
