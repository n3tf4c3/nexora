# Plano de melhorias do Nexora

Data: 2026-07-14
Snapshot analisado: `ca57fb59d7ce0ea01c6525d225a4fa574d859667`

## Objetivo

Evoluir o Nexora de um controle financeiro mensal com captura confiável de SMS para um sistema financeiro pessoal capaz de explicar a origem, a precisão e a completude dos seus dados.

O plano cobre frontend, backend, banco de dados, aplicativo Android, qualidade operacional e evolução do produto. As decisões fundamentais de `docs/PLANEJAMENTO.md` permanecem válidas.

## Decisões consolidadas

- Compras no cartão são reconhecidas como despesa no momento da compra.
- O pagamento da fatura apenas liquida a obrigação e não gera uma segunda despesa.
- O aplicativo Android será focado em captura, configuração e diagnóstico.
- A gestão financeira continua no web, que permanece como cockpit do sistema.
- O parser canônico executará no servidor depois da persistência do SMS bruto.
- Resultado incerto nunca cria uma transação silenciosamente.
- Parsers continuam sendo implementados somente a partir de amostras reais e sanitizadas.
- O SMS bruto permanece imutável e disponível para auditoria e reprocessamento.

## Diagnóstico executivo

A fundação técnica do Nexora é sólida. O sistema já possui dinheiro em centavos, contratos compartilhados, autenticação revogável, rate limit, headers de segurança, ingestão idempotente, confirmação atômica de SMS e armazenamento seguro do token no Android.

O principal risco deixou de ser a capacidade de capturar SMS. O desafio atual é provar que os dados capturados estão completos, corretamente interpretados e contabilizados sem dupla contagem.

Os próximos ganhos de valor devem vir de três movimentos:

1. Tornar a captura observável e operacionalmente confiável.
2. Transformar SMS em eventos versionados, explicáveis e reprocessáveis.
3. Corrigir a semântica financeira antes de implementar faturas, parcelas e recorrências.

## Pontos fortes que devem ser preservados

- Confirmação de SMS atômica por CTE e `FOR UPDATE`.
- Ingestão idempotente por hash e índice único.
- SMS bruto persistido e vinculado à entidade gerada.
- Token protegido pelo Android Keystore e comparado em tempo constante no servidor.
- Allowlist local de remetentes.
- Valores financeiros persistidos como inteiros em centavos.
- Separação entre datas civis e timestamps.
- Validação de posse no backend.
- CSP, HSTS, proteção contra framing e demais headers defensivos.
- Contratos de domínio compartilhados em `packages/core`.

## Riscos prioritários

### 1. Migrations podem ficar parcialmente aplicadas

O runner em `apps/web/scripts/migrar.ts` usa o migrator `neon-http`, que executa os statements sem garantir que toda a migration e seu registro sejam uma única unidade transacional.

Impacto: uma falha intermediária pode deixar o schema parcialmente alterado e impedir a reaplicação segura.

Ação:

- Implementar runner que execute cada migration e seu journal na mesma transação.
- Serializar execuções com advisory lock.
- Adicionar preflight antes de constraints mais restritivas.
- Testar instalação em banco vazio e upgrade a partir do snapshot anterior.

### 2. Mobile apresenta dados fictícios como se fossem reais

As telas de login, dashboard, contas, transações e fila usam mocks e ações locais. Isso conflita com a decisão de manter o mobile como capturador sem login próprio.

Impacto: o usuário pode acreditar que confirmou ou ignorou uma operação que nunca chegou ao servidor.

Ação:

- Remover as telas mockadas do fluxo de produção.
- Manter onboarding, permissão, configuração, fila local e diagnóstico.
- Não usar o token de captura para APIs de leitura financeira.

### 3. Falhas de sincronização ficam invisíveis

A tela atual mostra configuração e quantidade pendente, mas não informa última tentativa, último sucesso, erro, retries ou idade da fila.

Impacto: URL ou token incorretos podem interromper a captura sem um alerta claro.

Ação:

- Expor no módulo nativo última tentativa, último sucesso e último erro.
- Distinguir erro de rede, autenticação, rate limit, payload e servidor.
- Mostrar idade do SMS pendente mais antigo.
- Adicionar botão de teste de conexão.
- Exibir banner persistente quando a fila estiver parada.

### 4. O modelo financeiro não distingue competência e caixa

`transacoes` representa apenas entrada ou saída. Isso não diferencia compra no cartão, pagamento de fatura, transferência, previsão, aporte e ajuste.

Impacto: compras e pagamentos de fatura podem ser contados duas vezes, e previsões podem ser confundidas com fatos realizados.

Ação:

- Adicionar natureza da movimentação.
- Adicionar estado `prevista`, `efetivada`, `cancelada` ou equivalente.
- Tratar transferência própria como neutra em receitas e despesas.
- Tratar compra no cartão como despesa por competência.
- Tratar pagamento de fatura como liquidação do passivo.
- Tratar aporte como transferência para um ativo.

### 5. Um SMS só pode originar uma transação

O vínculo atual em `mensagens_sms` é 1:1. Uma compra parcelada capturada em um único SMS precisará originar várias parcelas.

Impacto: o modelo atual não preserva proveniência de todas as parcelas.

Ação:

- Introduzir uma entidade de evento financeiro.
- Evoluir o relacionamento para `mensagem_sms -> evento_financeiro -> N transacoes`.
- Garantir unicidade de parcela por compra e número.
- Preservar a mensagem como origem imutável.

### 6. A fronteira do parser planejada não corresponde ao runtime

O planejamento descreve parsing local em TypeScript, mas a captura em background ocorre no receiver e no WorkManager em Kotlin, sem runtime JavaScript.

Impacto: implementar parser em Kotlin duplicaria regras do `packages/core`.

Ação:

- Android captura e envia apenas o SMS bruto.
- A API persiste primeiro de forma idempotente.
- O servidor executa o parser de `@nexora/core`.
- O resultado versionado é gravado separadamente do SMS bruto.
- Parsing local, se existir no futuro, será apenas uma prévia não canônica.

### 7. Criação manual de transação não é idempotente

Retries, duplo clique ou duas abas podem criar lançamentos duplicados.

Ação:

- Gerar uma chave por submissão.
- Persistir a chave com unicidade por usuário.
- Tratar conflito como sucesso da operação original.

### 8. Integridade de propriedade depende da aplicação

As FKs de usuário, conta e categoria são independentes. As actions validam corretamente a posse, mas scripts ou rotas futuras podem criar referências cruzadas.

Ação:

- Adicionar unicidades parentais `(usuario_id, id)`.
- Adicionar FKs compostas de transação para conta e categoria.
- Adicionar FK composta de mensagem para transação ou evento.
- Executar preflight antes da migration.

### 9. A captura depende de `Content-Length`

O limite de 256 KiB é verificado pelo header, mas o corpo real é lido integralmente com `req.json()`.

Ação:

- Usar `Content-Length` apenas para rejeição antecipada quando presente.
- Contar os bytes reais durante a leitura do stream.
- Interromper a leitura ao ultrapassar o limite.
- Manter contrato estável para 400, 401, 413, 429, 503 e erros transitórios.

### 10. Um item inválido pode bloquear o lote inteiro

O corpo do SMS possui limite de 2.000 caracteres e o lote é validado como uma unidade.

Impacto: uma mensagem longa pode impedir a persistência das demais e contrariar a regra de guardar o bruto.

Ação:

- Persistir o corpo como `text`.
- Manter limite de bytes da requisição.
- Validar cada item individualmente.
- Persistir ou colocar em quarentena itens rejeitados, com motivo.

### 11. Exclusões financeiras não têm histórico

Transações manuais são apagadas fisicamente e não possuem `atualizado_em`, motivo de cancelamento ou versão anterior.

Ação:

- Preferir cancelamento ou soft delete para transações.
- Registrar instante e motivo.
- Adicionar `atualizado_em` e versão para concorrência otimista.
- Arquivar contas e categorias em vez de removê-las quando houver histórico.

## Melhorias de frontend

### Correções funcionais

- Preservar `q` e `pagina` ao editar ou cancelar uma edição.
- Redirecionar páginas excedentes para a última página válida.
- Manter paginação disponível após excluir o último item da página.
- Colocar a busca na própria tela de transações para funcionar no mobile.
- Preservar o mês selecionado ao navegar do dashboard para a listagem.
- Adicionar edição e arquivamento de contas e categorias.

### Responsividade

- Mover sidebar, tabelas desktop e grades de três colunas de `md` para `lg`.
- Avaliar container queries para componentes dependentes da largura útil.
- Testar larguras de 360, 768, 820, 1024 e 1440 pixels.
- Evitar renderizar simultaneamente grandes versões desktop e mobile da mesma lista.

### Acessibilidade

- Adicionar `<main>`, `<nav aria-label>` e skip link.
- Garantir `id`, `htmlFor`, `aria-invalid` e `aria-describedby` nos formulários.
- Anunciar erros e sucessos com regiões ao vivo.
- Gerenciar foco após erro de validação.
- Corrigir a hierarquia de títulos.
- Fornecer resumo textual para gráficos.
- Nomear botões de ícone e informar a tab selecionada no Android.
- Garantir alvos de toque de pelo menos 48 pixels.
- Revisar contraste de textos auxiliares e chips.

### Desempenho e clareza

- Agregar dados do dashboard no PostgreSQL.
- Mostrar somente as transações mais recentes no dashboard.
- Revisar pendências em lotes menores ou uma por vez.
- Agregar o gráfico por dia e exibir linha de zero.
- Mostrar valor e percentual nos gastos por categoria.
- Diferenciar claramente vazio, erro, loading e indisponibilidade.

## Melhorias de backend

- Versionar contratos de entrada e resposta da API no `packages/core`.
- Retornar erros discriminados para o mobile decidir entre retry, reconfiguração e descarte.
- Diferenciar rate limit de indisponibilidade do Upstash.
- Adicionar `Retry-After` para erros transitórios.
- Produzir logs estruturados com ID de correlação, sem token ou corpo do SMS.
- Reequilibrar o rate limit por conta para evitar bloqueio direcionado pelo e-mail.
- Validar login com contrato compartilhado e hash dummy para usuário inexistente.
- Fixar deliberadamente a versão do Auth.js enquanto permanecer beta.
- Adicionar idempotência também a recorrências, parcelas e imports futuros.
- Usar concorrência otimista em edições financeiras.

## Melhorias de banco de dados

- Tornar migrations transacionais e serializadas.
- Garantir a premissa single-user no banco ou no seed, não apenas na API.
- Adicionar FKs compostas de propriedade.
- Adicionar checks para textos não vazios e hashes válidos.
- Normalizar unicidade de e-mail, conta e categoria sem diferença de caixa.
- Evoluir SMS para corpo `text` e metadados de parser.
- Registrar identificador do dispositivo e ID nativo do SMS quando disponível.
- Adicionar `parser_id`, `parser_version`, confiança, payload extraído e motivo de falha.
- Adicionar `atualizado_em`, cancelamento e histórico financeiro.
- Ordenar paginação por `(data, criado_em, id)`.
- Migrar para cursor quando o volume justificar.
- Avaliar `pg_trgm` somente após medir busca real com `EXPLAIN`.

## Arquitetura proposta para interpretação

```text
SMS Android
  -> mensagem_sms bruta e imutável
  -> interpretação versionada do parser
  -> evento financeiro aceito
  -> uma ou mais transações, parcelas ou faturas
```

Dimensões independentes:

| Dimensão | Estados exemplificativos |
|---|---|
| Transporte | recebida, duplicada, rejeitada |
| Interpretação | não processada, reconhecida, parcial, não suportada, erro |
| Revisão | aguardando, confirmada, ignorada |
| Destino | transação, fatura, recorrência, informativo |

Tipos iniciais de evento no core:

- `pix_recebido`
- `pix_enviado`
- `compra_cartao`
- `fatura_fechada`
- `pagamento_fatura`
- `informativo`
- `nao_suportado`

## Proposta diferenciadora: Nexora Fechado

### Visão

O Nexora não deve apenas somar o que conhece. Ele deve informar quanto do período consegue realmente explicar.

Exemplo:

> Este mês está 96% explicado. Há R$ 37,20 ainda não reconciliados.

### Fluxo

1. Um SMS de fatura fechada é persistido como evento, não como despesa.
2. O parser extrai cartão, total, vencimento e demais dados disponíveis.
3. Compras, parcelas, créditos, taxas e pagamentos conhecidos são associados ao ciclo.
4. O sistema compara o total informado pelo banco ao total explicado.
5. A diferença vira uma pendência objetiva.
6. Quando a diferença chega a zero, a fatura recebe o estado `reconciliada`.
7. O dashboard mostra valores financeiros e também a qualidade dos dados.

### Índice de Confiança Financeira

O índice poderá combinar:

- saúde da captura;
- idade da fila local;
- cobertura conhecida dos bancos;
- precisão dos parsers;
- pendências de revisão;
- faturas reconciliadas;
- valores ainda sem explicação.

### MVP incremental

| Versão | Entrega |
|---|---|
| MVP 0 | Classificar o SMS Amazon existente como `fatura_fechada` e associá-lo ao cartão |
| MVP 1 | Criar fatura, comparar total informado e total explicado |
| MVP 2 | Reconciliação guiada de compras, créditos, taxas e ajustes |
| MVP 3 | Indicador de completude e confiança no dashboard |
| MVP 4 | Importação opcional de CSV para cobrir eventos sem SMS |

## Roadmap de execução

### Etapa 1 - Confiança operacional

Entregas:

- Corrigir o runner de migrations.
- Remover as telas mockadas do fluxo mobile.
- Implementar painel de saúde da captura.
- Adicionar teste de conexão e provisionamento guiado.
- Compilar e testar Kotlin/Gradle no CI.
- Testar app fechado, offline, retorno da rede, reboot, token incorreto e retries.

Critério de conclusão:

> Um SMS real recebido offline sincroniza quando a rede retorna, e qualquer falha permanente fica visível no aplicativo.

### Etapa 2 - Interpretação mínima

Entregas:

- Definir interface de parser no core.
- Implementar parser de Pix recebido do Itaú.
- Implementar parser de Pix enviado do Itaú.
- Classificar a fatura fechada do cartão Amazon.
- Persistir parser, versão, resultado e confiança.
- Pré-preencher a fila web.
- Permitir reprocessamento de mensagens antigas.

Critério de conclusão:

> Um SMS Itaú suportado chega à fila com tipo, valor e data corretos sem alterar o texto bruto.

### Etapa 3 - Fundação semântica financeira

Entregas:

- Natureza e estado da movimentação.
- Transferências entre contas.
- Saldo inicial ou snapshots de reconciliação.
- Eventos financeiros e origem 1:N.
- Histórico de edição e cancelamento.
- Exportação CSV/JSON e procedimento de recuperação.

Critério de conclusão:

> Transferências não inflam receitas ou despesas, e o pagamento do cartão não duplica a compra.

### Etapa 4 - Qualidade do frontend

Entregas:

- Corrigir edição e paginação.
- Melhorar navegação mobile web.
- Corrigir acessibilidade e breakpoints.
- Adicionar edição e arquivamento de contas e categorias.
- Otimizar dashboard e fila.
- Criar testes E2E e visuais.

Critério de conclusão:

> Login, lançamento, edição, busca, exclusão e confirmação de SMS funcionam por teclado e em todas as larguras de referência.

### Etapa 5 - Cartão e Nexora Fechado

Entregas:

- Faturas por ciclo.
- Compras e parcelas associadas às faturas corretas.
- Créditos, estornos, encargos e pagamento como liquidação.
- Reconciliação por total de fatura.
- Índice de confiança no dashboard.

Critério de conclusão:

> Uma compra em três parcelas aparece nas três faturas corretas, sem dupla contagem, e a fatura informa quanto está explicado.

### Etapa 6 - Recorrências e previsão

Entregas:

- Regra recorrente separada da ocorrência.
- Ocorrências previstas com chave idempotente.
- Matching entre previsto e SMS efetivo.
- Projeção de 12 meses separando confirmado e estimado.

Critério de conclusão:

> Uma recorrência prevista é conciliada pelo SMS real sem criar uma transação duplicada.

### Etapa 7 - Metas e investimentos

Entregas:

- Metas e reservas antes de posições de investimento.
- Aportes tratados como transferência para ativo.
- Quantidades fracionárias com `numeric`, nunca `float`.
- Rentabilidade separada de fluxo de caixa.

Critério de conclusão:

> Aportes alteram a posição e o caixa sem aparecer como despesa de consumo.

## Estratégia de testes

### Core

- Fixtures sanitizadas para cada formato real.
- Testes por parser e versão.
- Casos ambíguos, incompletos e não suportados.
- Distribuição de centavos em parcelas.
- Datas de fechamento entre os dias 29 e 31.
- Competência, transferência e liquidação de fatura.

### Web e API

- Auth válida, inválida, expirada e revogada.
- Rate limit por IP, conta e falha do Upstash.
- Captura sem `Content-Length`, acima do limite e com item inválido.
- Duplicatas no mesmo lote e entre retries.
- Concorrência entre confirmar e ignorar.
- Idempotência de transações manuais.
- Posse e referências cruzadas.
- Migrations vazias e incrementais em PostgreSQL descartável.

### Frontend

- Playwright para os fluxos financeiros essenciais.
- Axe para acessibilidade.
- Testes visuais em 360, 768, 820, 1024 e 1440 pixels.
- Edição após busca e na segunda página.
- Exclusão do último item de uma página.
- Estados loading, erro, vazio e retry.

### Android

- Compilação Gradle no CI.
- Normalização e allowlist.
- SMS multipart.
- Fila SQLite.
- Respostas 2xx, 4xx, 429 e 5xx.
- Retry e preservação da fila.
- App fechado, reboot e economia de bateria.
- Revalidação de permissão ao voltar ao foreground.

## Métricas privadas de saúde

Não é necessário adotar analytics de terceiros. Uma página privada pode apresentar:

- SMS elegíveis capturados;
- mensagens aceitas e duplicadas;
- idade da fila local e da fila web;
- latência entre recebimento e persistência;
- erros por categoria;
- precisão por parser e campo;
- confirmações sem edição;
- lançamentos manuais evitados;
- faturas reconciliadas;
- diferença financeira ainda não explicada.

## Ordem de prioridade

1. Migrations seguras.
2. Mobile honesto e diagnóstico da captura.
3. CI e testes nativos.
4. Parser canônico no servidor.
5. Eventos versionados e semântica financeira.
6. Correções funcionais, acessibilidade e responsividade do web.
7. Faturas e Nexora Fechado.
8. Recorrências.
9. Metas.
10. Investimentos.

## Progresso de execução

Atualizado em 2026-07-14:

- Etapa 1 concluída: runner de migrations atômico, mobile reduzido a captura/diagnóstico, teste de conexão, telemetria local segura, testes JVM e build Android no CI.
- Transporte validado em aparelho real: SMS Itaú recebido com app fechado, enviado com HTTP 200 e persistido no Neon.
- Etapa 2 implementada localmente: parsers Itaú Pix e fatura Amazon no core, interpretações append-only e fila web pré-preenchida.
- Pendente para concluir a Etapa 2: aplicar a migration aditiva, reprocessar o histórico e publicar o backend/frontend.

## Itens que não devem ser feitos agora

- Integrar as telas financeiras mockadas do mobile.
- Criar login mobile real.
- Usar o token de captura para APIs de leitura.
- Escrever parsers genéricos sem amostras reais.
- Auto-confirmar transações antes de medir correções.
- Adicionar captura por push sem nova decisão formal.
- Começar investimentos antes de resolver transferências, competência e faturas.
- Aplicar `npm audit fix --force` sem atualização deliberada das famílias afetadas.

## Validação da análise

- Segurança estática: 18 quesitos PASS, 1 PARCIAL, nenhuma FALHA e 9 N-A justificados.
- Pendência de segurança não bloqueante: centralização incompleta das env vars no tooling.
- `npm audit`: 16 advisories moderados em dependências transitivas de tooling, sem superfície explorável identificada no runtime atual.
- Typecheck, lint, testes, build web, Expo Doctor e build Android devem ser repetidos durante a execução porque a auditoria automatizada anterior foi feita antes da entrada do módulo nativo.

## Histórico de auditoria

Na próxima auditoria formal, reavaliar como parciais ou reabertos:

- Achado 7: a invariante single-user é detectada na API, mas não impedida pelo banco ou seed.
- Achado 14: o mobile agora possui código nativo, mas o CI ainda não o compila nem testa.
- Achado 15: novos componentes web e mobile possuem lacunas de acessibilidade.
- Achado 22: a navegação mensal ainda falha nas bordas de 1900 e 2199.

Os novos achados devem seguir a numeração durável do ledger em `docs/auditoria-achados.md` quando um novo relatório formal for emitido.
