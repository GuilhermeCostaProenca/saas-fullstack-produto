# PRD - SaaS Full-Stack Produto

## 1. Problema
Profissionais e pequenos times perdem visibilidade de entregas porque tarefas, prioridades e progresso ficam espalhados em ferramentas diferentes.

## 2. Publico-alvo
- Freelancer com 1-5 clientes ativos
- Pequeno time de produto (ate 10 pessoas)
- Gestor que precisa de visibilidade simples sem ferramenta pesada

## 3. Proposta de valor
Um SaaS de gestao de entregas com foco em simplicidade: quadro de tarefas, prioridades, status e visao de progresso por projeto.

## 4. MVP (escopo inicial)
- Autenticacao: cadastro, login, logout
- Organizacao basica: workspace pessoal
- Projetos: criar, editar, listar, arquivar
- Tarefas: criar, editar, mover status (`todo`, `doing`, `done`)
- Prioridade da tarefa (`low`, `medium`, `high`)
- Filtro por projeto, status e prioridade
- Dashboard simples com contagem por status

## 5. Fora de escopo (agora)
- Colaboracao multiusuario em tempo real
- Integracao com email/Slack
- Billing e assinatura
- Automacoes complexas e IA generativa

## 6. Requisitos funcionais
- Usuario autenticado deve conseguir criar projeto
- Projeto deve conter tarefas vinculadas
- Mudanca de status deve refletir imediatamente na UI
- Dashboard deve mostrar total por status

## 7. Requisitos nao funcionais
- API com validacao de entrada
- Tratamento consistente de erro
- Logs basicos no backend
- Tempo de resposta aceitavel para fluxo normal
- CI com lint + test + build

## 8. Metricas de sucesso (MVP)
- Usuario consegue concluir o fluxo `criar projeto -> criar tarefa -> concluir tarefa`
- 80% dos fluxos criticos com testes (minimo unitario/integracao basica)
- CI verde no branch principal

## 9. Entregaveis do MVP
- Frontend Next.js
- Backend NestJS
- Banco PostgreSQL com migrations
- Docker Compose para desenvolvimento
- README com setup completo
- Release `v1.0.0`

## 10. Riscos
- Escopo crescer cedo demais
- Atrasar testes por foco apenas em UI
- Decisoes de arquitetura sem documentacao

## 11. Mitigacoes
- Travar escopo no MVP acima
- Testes nos fluxos criticos desde o inicio
- Atualizar `ARCHITECTURE.md` a cada decisao relevante
