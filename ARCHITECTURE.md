# ARCHITECTURE - SaaS Full-Stack Produto

## 1. Visao geral
Arquitetura em 3 camadas principais:
- `apps/web` (Next.js): interface do usuario
- `apps/api` (NestJS): regras de negocio e API REST
- `infra/db` (PostgreSQL): persistencia

## 2. Estrutura proposta
```txt
saas-fullstack-produto/
  apps/
    web/
    api/
  packages/
    shared-types/
    eslint-config/
    tsconfig/
  infra/
    docker/
    db/
  docs/
    PRD.md
    ARCHITECTURE.md
```

## 3. Dominios do MVP
- Auth
- Projects
- Tasks
- Dashboard

## 4. Modelo de dados inicial
- users
  - id (uuid)
  - name
  - email (unique)
  - password_hash
  - created_at
- projects
  - id (uuid)
  - user_id (fk users.id)
  - name
  - description
  - archived (boolean)
  - created_at
- tasks
  - id (uuid)
  - project_id (fk projects.id)
  - title
  - description
  - status (`todo`|`doing`|`done`)
  - priority (`low`|`medium`|`high`)
  - due_date (nullable)
  - created_at

## 5. API inicial (MVP)
- `POST /auth/register`
- `POST /auth/login`
- `GET /projects`
- `POST /projects`
- `PATCH /projects/:id`
- `GET /projects/:id/tasks`
- `POST /projects/:id/tasks`
- `PATCH /tasks/:id`
- `GET /dashboard/summary`

## 6. Decisoes tecnicas
- Monorepo para acelerar evolucao compartilhada
- TypeScript ponta a ponta
- Validacao de DTO no backend
- Autenticacao JWT no MVP
- Prisma ou TypeORM (decidir no setup)

## 7. Qualidade e observabilidade
- Lint + format + typecheck
- Testes:
  - backend: unit + integracao de endpoints criticos
  - frontend: unit/component dos fluxos principais
- Logs estruturados no backend

## 8. CI/CD
Pipeline minima:
1. Install
2. Lint
3. Test
4. Build

Deploy pode iniciar manual (MVP), com guia no README.

## 9. Segurança
- Hash de senha com bcrypt/argon2
- Validacao de input em todas rotas
- Controle de acesso por usuario
- Segredos via variaveis de ambiente

## 10. Evolucao pos-MVP
- Multiusuario por workspace
- Comentarios em tarefas
- Notificacoes
- Billing
