# ── Estágio 1: Build React ────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copia só package.json primeiro para aproveitar cache de layer
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --frozen-lockfile

# Copia o restante do código do frontend
COPY frontend/ .

# VITE_API_URL vem como build arg do compose
# Deixar vazio = chamadas vão para /api/... (resolvido pelo nginx no mesmo host)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Estágio 2: Servir com nginx ───────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

RUN rm /etc/nginx/conf.d/default.conf

# nginx.conf vem da raiz do projeto (contexto de build é a raiz)
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/app.conf

# Arquivos estáticos do build React
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
