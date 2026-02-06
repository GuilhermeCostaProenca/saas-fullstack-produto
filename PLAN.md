# PLAN.md - SaaS Full-Stack Produto

## Norte do Projeto
**Objetivo:** Entregar um SaaS full-stack funcional e apresentavel para portfolio, com fluxo ponta a ponta, qualidade e release.

**Stack alvo:** Frontend (Next.js), Backend (Node/Nest), PostgreSQL, Docker, GitHub Actions

**Definicao de sucesso (resultado final):** Aplicacao web com autenticacao, dominio principal implementado, testes basicos, CI e deploy documentado.

## COMECO (Fundacao)
1. Definir escopo MVP em 1 pagina (PRD.md): problema, publico, funcionalidades, fora de escopo.
2. Definir arquitetura inicial (ARCHITECTURE.md): modulos, fluxo de dados, decisoes tecnicas.
3. Preparar ambiente e estrutura base do codigo.
4. Configurar padrao de qualidade: lint, testes basicos, CI.

**Saidas obrigatorias do COMECO:**
- PRD.md
- ARCHITECTURE.md
- Projeto iniciando localmente
- Pipeline CI executando checks basicos

## MEIO (Construcao)
1. Implementar o fluxo principal ponta a ponta (happy path).
2. Implementar autenticacao/autorizacao (quando aplicavel).
3. Implementar validacoes, tratamento de erro e logs.
4. Cobrir com testes os fluxos criticos.
5. Atualizar README com instrucoes reais de execucao.

**Saidas obrigatorias do MEIO:**
- Fluxo principal funcional
- Testes minimos rodando
- Documentacao tecnica atualizada
- CI verde de forma consistente

## FIM (Polimento e Publicacao)
1. Revisar codigo, remover codigo morto e consolidar padroes.
2. Completar README em formato case study (problema, arquitetura, decisoes, trade-offs, resultado).
3. Gerar evidencias: screenshots/GIF/demo.
4. Publicar release 1.0.0 com notas claras.
5. Criar backlog de evolucao (NEXT_STEPS.md).

**Saidas obrigatorias do FIM:**
- README.md de portfolio
- CHANGELOG.md e release 1.0.0
- Demo registrada (link ou midia)
- Projeto pronto para apresentar em entrevista

## Regras de Execucao para IA (ou Codex)
1. Sempre manter foco no objetivo final deste plano.
2. Antes de codar, criar mini-plano da tarefa atual (3-6 passos).
3. Entregar valor incremental: cada tarefa deve deixar o projeto mais demonstravel.
4. Nao quebrar funcionamento existente.
5. Ao terminar uma tarefa, registrar:
   - o que foi feito,
   - como validar,
   - riscos pendentes,
   - proxima tarefa recomendada.

## Ordem de Prioridade (fixa)
1. Fluxo principal funcionando.
2. Qualidade tecnica (teste, erro, CI).
3. Documentacao de alto impacto para portfolio.
4. Performance e extras.

## Criterio de Aceite Final
O projeto esta concluido quando uma pessoa externa consegue:
1. Entender o problema resolvido em menos de 2 minutos (README).
2. Rodar o projeto com instrucoes claras.
3. Ver evidencias de qualidade (CI, testes, arquitetura).
4. Avaliar maturidade tecnica pelas decisoes e trade-offs documentados.

