# SaaS Fullstack Produto

SaaS full-stack real com `web + api + postgres`, focado em portfolio profissional.

## Stack
- Frontend: Next.js + TypeScript (`apps/web`)
- Backend: Fastify + Prisma + JWT (`apps/api`)
- Banco: PostgreSQL via Docker (`infra/docker-compose.yml`)

## MVP atual
- Auth: register/login com JWT
- Projects: listar, criar, editar/arquivar
- Tasks: listar por projeto, criar, editar status/prioridade
- Dashboard summary por usuario
- Frontend com login e dashboard conectado ao backend

## Estrutura
- `apps/web`
- `apps/api`
- `infra/docker-compose.yml`
- `PRD.md`, `ARCHITECTURE.md`, `BACKLOG.md`, `PLAN.md`

## Como rodar (1 comando)
Na raiz do repositorio:
```bash
npm run dev
```

Esse comando faz automaticamente:
- cria `apps/api/.env` e `apps/web/.env.local` se nao existirem
- instala dependencias de `apps/api` e `apps/web` (se faltar `node_modules`)
- sobe Postgres via `infra/docker-compose.yml`
- executa `prisma generate` e `prisma migrate deploy`
- inicia API e Web juntos

Se quiser apenas preparar ambiente sem subir os servidores:
```bash
npm run dev:prepare
```

## URLs
- Web: `http://localhost:3000`
- API: `http://localhost:3333`
- Health: `http://localhost:3333/health`

## Proximo passo
- Implementar tela de Projects e Tasks com dados reais da API.
