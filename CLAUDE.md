# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O projeto

Nexora é uma ferramenta financeira **pessoal** (single user, sem lojas de app) que captura pagamentos via SMS no Android e organiza entradas/saídas, cartão de crédito, recorrências, projetos de aquisição e investimentos. O planejamento completo, com decisões, arquitetura, modelo de dados e fases verificáveis, está em [docs/PLANEJAMENTO.md](docs/PLANEJAMENTO.md) — leia antes de implementar qualquer coisa.

Decisões-fundação (não reabrir sem motivo):
- Distribuição por APK fora das lojas — é o que torna a leitura de SMS legal na prática (Play Store veta `READ_SMS` para apps financeiros; iOS não tem API de SMS).
- Captura **só por SMS** (push/NotificationListenerService considerado e descartado; ver planejamento).
- Monorepo padrão da casa: `apps/web` (Next.js + Drizzle + Neon + NextAuth), `apps/mobile` (Expo + dev client), `packages/core` (domínio puro: parsers de SMS e regras de fatura/parcela/recorrência).
- SMS cru sempre persistido; parser incerto vira pendência de confirmação, nunca transação errada silenciosa.

## Estado atual

Fase 0 (fundação) concluída: esqueleto do monorepo com login funcionando. Próxima: Fase 1 — núcleo financeiro na web (contas, categorias, transações manuais, dashboard do mês).

## Comandos (raiz)

- `npm run web` — dev server do Next.js
- `npm run web:build` — build de produção do web
- `npm run mobile` — Expo dev server
- `npm run typecheck` / `npm run lint` / `npm test` — todos os workspaces
- Banco (workspace web): `npm run db:generate|db:migrate|db:seed:admin --workspace apps/web`

## Stack e pegadinhas

- **Banco**: Neon via driver `neon-http` — **não tem transação interativa**; operações multi-passo usam `UPDATE ... WHERE ... RETURNING` condicional ou `db.batch`.
- **Auth**: NextAuth v5 (JWT, provider credentials, single user). Troca de senha carimba `credenciais_atualizadas_em` e invalida JWTs anteriores (checado no callback `jwt`).
- **Rate limit**: Upstash no login — fail-closed quando configurado; no-op sem as env vars (dev/CI).
- **Env vars**: validadas em `apps/web/src/env.ts` (zod) — toda leitura de `process.env` passa por lá. `.env.example` versionado em `apps/web`.
- **Dinheiro**: inteiros em centavos (BRL) — helpers em `packages/core/src/dinheiro.ts`. Nunca float.
- **@nexora/core** é consumido como fonte TS (`transpilePackages` no Next; Metro resolve no Expo). Domínio puro: sem dependência de framework.
- **Mobile**: Expo managed não lê SMS — a captura (Fase 2) exigirá dev client com módulo nativo.

## Convenções

- Idioma do usuário, da documentação e do código de domínio (nomes/comentários): português brasileiro (pt-BR).
- Validações e contratos compartilhados nascem no `packages/core`, nunca duplicados entre web e mobile.
