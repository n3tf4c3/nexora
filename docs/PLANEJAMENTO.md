# Nexora — Planejamento

Ferramenta financeira pessoal que captura pagamentos via SMS do celular e organiza entradas, saídas, cartão de crédito, recorrências, projetos de aquisição e investimentos.

## Decisões e premissas

| Decisão | Escolha | Justificativa |
|---|---|---|
| Distribuição | Uso pessoal, APK fora das lojas | Libera a permissão `READ_SMS`/`RECEIVE_SMS` no Android sem a política da Play Store (que veta SMS para apps financeiros). |
| Captura | SMS direto no Android | Escolha do usuário; viável porque não passa pela loja. iOS fica de fora da captura (sem API de SMS). |
| Plataforma | Monorepo padrão da casa: `apps/web` (Next.js + Drizzle + Neon + NextAuth), `apps/mobile` (Expo) e `packages/core` | Celular captura; web é o cockpit de análise e gestão. |
| Usuários | Single user (uso pessoal) | Sem multi-tenancy, sem planos/billing. Auth simples com NextAuth. |
| Moeda/contexto | BRL, bancos brasileiros, SMS em pt-BR | Parsers escritos para os formatos reais dos bancos do usuário. |
| Fonte de captura | Só SMS (decisão de 2026-07-12) | Notificações push (`NotificationListenerService`) foram consideradas e descartadas por escolha do usuário; viram alternativa futura se algum banco não enviar SMS. |
| Auth mobile → API | Token estático (env var no app, conferido na API) | Single user, uso pessoal: sem fluxo de login no celular. **Risco aceito** (auditoria 2026-07-13, achado 5): sem identidade/revogação por dispositivo. Mitigações obrigatórias: token nunca em `EXPO_PUBLIC_*`, `app.json` ou código; no aparelho, guardado via Keystore (`expo-secure-store`); rotação = trocar env na Vercel + no app (ver skill `rotacao-segredos`); vazamento é contido pelo rate limit por IP e pela fila de confirmação (captura não cria transação sozinha). |

**Premissa a validar na Fase 2:** quais bancos/cartões enviam SMS para o usuário — os parsers serão escritos a partir de amostras reais dos SMS dele, não de templates genéricos.

## Arquitetura (visão geral)

```
apps/mobile (Expo + dev client, Android)
  ├─ BroadcastReceiver de SMS (módulo nativo / config plugin — RECEIVE_SMS)
  ├─ Fila local durável + WorkManager
  └─ Envia à API somente o SMS cru

apps/web (Next.js na Vercel)
  ├─ API persiste o bruto antes de interpretar
  ├─ Executa os parsers canônicos do packages/core no servidor
  ├─ Dashboard mensal, faturas, recorrências, projetos, investimentos
  └─ Fila de confirmação: SMS não reconhecidos viram pendências para revisão manual

packages/core (domínio puro, testável)
  ├─ Parsers de SMS por banco (regex/heurística + testes com amostras reais)
  └─ Regras de domínio: fatura/fechamento, parcelas, projeção de recorrências
```

Pontos de desenho importantes:

- **SMS cru sempre é guardado** (`raw_messages`): permite reprocessar quando um parser melhora e auditar o que foi capturado.
- **Deduplicação** por hash de remetente + instante exato de recebimento + corpo (reenvio/retry do app não duplica). Decisão (achado 10 da auditoria de 2026-07-13): janela temporal foi descartada porque fundiria compras idênticas legítimas feitas em instantes próximos; o retry do app reenvia o mesmo timestamp, então o caso real de duplicação está coberto. Evolução natural na Fase 2: usar o identificador estável do SMS fornecido pelo Android.
- **Parser incerto → pendência**, nunca transação silenciosamente errada. A fila de confirmação é o mecanismo de segurança do sistema todo.
- **Parsing canônico no servidor**: o receiver e o WorkManager funcionam sem runtime JavaScript; portar regex para Kotlin duplicaria regras. O Android envia o bruto, a API persiste primeiro e só então executa `packages/core`. Cada resultado guarda parser, versão e confiança para permitir reprocessamento sem apagar o histórico.
- Expo managed não lê SMS: será necessário **dev client** com módulo nativo (ex.: config plugin próprio ou lib tipo `react-native-get-sms-android`), build via EAS ou local.

## Modelo de dados (alto nível)

- `accounts` — contas (corrente, carteira) e cartões de crédito (com dia de fechamento e vencimento).
- `transactions` — toda movimentação (entrada/saída), com categoria, conta/cartão de origem, vínculo opcional com parcela, recorrência ou projeto.
- `categories` — categorias de gasto/receita.
- `invoices` — faturas de cartão (ciclo por fechamento); transações de cartão pertencem a uma fatura.
- `installments` — compras parceladas (geram N transações futuras nas faturas certas).
- `recurrences` — regras de pagamento recorrente (mensal/anual, valor, dia), geram transações previstas e alimentam a projeção de caixa.
- `projects` — metas de aquisição (valor alvo, aportes, progresso).
- `investments` — posições e aportes de investimentos.
- `raw_messages` — SMS crus recebidos, com status (parseado / pendente / ignorado).
- `sms_interpretations` — resultados append-only dos parsers, com parser, versão, confiança e payload extraído.

## Fases

Cada fase termina com uma verificação concreta na tela — não se avança com a anterior quebrada.

```
Fase 0 — Fundação
  Bootstrap do monorepo padrão da casa (web + mobile + core, CI).
  → verificar: typecheck, lint e build passam; `npm run dev` sobe; login funciona.

Fase 1 — Núcleo financeiro (web)
  Contas, categorias, transações manuais, dashboard do mês (entradas, saídas, saldo).
  → verificar: cadastrar conta → lançar transações → dashboard reflete os números.

Fase 2A — Transporte por SMS (concluída)
  App Android recebe SMS, filtra remetentes, preserva fila offline e envia o bruto à API;
  painel mobile mostra saúde da captura e a fila web recebe a mensagem.
  → verificado: Pix Itaú real capturado com app fechado, enviado e persistido como pendência.

Fase 2B — Interpretação assistida (concluída)
  API executa parsers versionados no servidor e pré-preenche a fila sem confirmar sozinha.
  → verificar: Pix Itaú recebido/enviado chega com tipo, valor e descrição corretos.

Fase 2C — Cobertura e confiança operacional (em validação)
  Medir cobertura banco × evento, correções humanas e idade das filas local/web;
  reaproveitar conta/categoria somente de confirmações anteriores equivalentes.
  → verificar: falha de permissão, rede ou credencial fica visível e nenhuma lacuna é silenciosa.

Fase 3 — Cartão de crédito
  Faturas por ciclo de fechamento, compras parceladas distribuídas nas faturas futuras.
  → verificar: compra parcelada em 3x aparece nas 3 faturas corretas com o vencimento certo.

Fase 4 — Recorrências e agendamentos
  Regras mensais/anuais, transações previstas, projeção de fluxo de caixa 12 meses.
  → verificar: recorrência cadastrada aparece na projeção e vira transação no dia.

Fase 5 — Projetos de aquisição e investimentos
  Metas de compra com aportes e progresso; registro de posições e aportes de investimento.
  → verificar: meta criada mostra progresso correto após aportes; posição registrada aparece no consolidado.
```

## Fora de escopo (por decisão, não esquecimento)

- iOS (sem API de SMS; app é de uso pessoal Android).
- Publicação em lojas, multi-usuário, planos/billing.
- Captura por notificações push dos apps dos bancos (`NotificationListenerService`) — considerada e descartada na v1; alternativa futura se algum banco não enviar SMS.
- Open Finance/agregadores (Pluggy etc.) — alternativa futura se SMS deixar de cobrir os bancos.
- Cotação automática de investimentos (v1 registra manualmente; integração de preços é evolução).
