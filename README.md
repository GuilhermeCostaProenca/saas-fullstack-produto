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

## Como rodar
1. Banco:
```bash
docker compose -f infra/docker-compose.yml up -d
```
2. API:
```bash
cd apps/api
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```
3. Web:
```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

## URLs
- Web: `http://localhost:3000`
- API: `http://localhost:3333`
- Health: `http://localhost:3333/health`

## Próximo passo
- Implementar tela de Projects e Tasks com dados reais da API.
