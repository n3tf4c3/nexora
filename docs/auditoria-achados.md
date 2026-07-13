# Ledger de Achados de Auditoria

Fonte durável da numeração e do estado dos achados. Relatórios detalhados ficam fora do repositório em `C:\Codes\relatorios\nexora`.

Estados: `ABERTO`, `EM CORREÇÃO`, `RESOLVIDO`, `RISCO ACEITO`.

| # | Achado | Severidade | Status | Primeira identificação | Relatório |
|---:|---|---|---|---|---|
| 1 | Amostra bancária real pronta para entrar em repositório público | Alta | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 2 | `AUTH_SECRET` aceita segredo de entropia insuficiente | Alta | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 3 | Rate limit pode ficar desativado e não cobre toda a superfície | Alta | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 4 | Confirmação de SMS não é atômica | Alta | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 5 | Token estático do APK não identifica nem revoga dispositivos | Média | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 6 | Dependências possuem advisories alto e moderados | Média | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 7 | Invariante single-user não é garantida | Média | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 8 | CHECK de dias do cartão aceita estados inválidos | Média | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 9 | Vínculo e ciclo de vida SMS-transação sem constraints | Média | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 10 | Captura transforma SMS cru e diverge na deduplicação | Média | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 11 | Contrato monetário excede o banco e parser aceita entrada malformada | Média | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 12 | Índices insuficientes e fila sem limite | Média | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 13 | Tela oculta transações após o 100º registro | Média | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 14 | CI não cobre web/mobile de forma suficiente | Média | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 15 | Formulários e controles sem semântica acessível | Média | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 16 | Login mascara falhas e pode travar pendente | Média | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 17 | Landing oferece cadastro e automação inexistentes | Média | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 18 | CSP ausente | Média | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 19 | Ações destrutivas sem confirmação ou recuperação | Média | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 20 | Seed aceita senha fraca e e-mail inválido | Média | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 21 | Busca aceita curingas e query repetida quebra rota | Baixa | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 22 | Ano zero quebra navegação mensal | Baixa | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 23 | Configuração não integralmente versionada/centralizada | Baixa | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 24 | IDs destrutivos não são validados como UUID | Baixa | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 25 | Normalização e limites de formulário inconsistentes | Baixa | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
| 26 | Rotas sem loading/erro e risco de overflow intermediário | Baixa | ABERTO | 2026-07-13 | `auditoria-2026-07-13-054504.md` |
