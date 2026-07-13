# Amostras reais de SMS bancários

Base de coleta da Fase 2 — os parsers do `packages/core` nascem destes textos,
nunca de templates genéricos (ver PLANEJAMENTO.md).

**Política de sanitização (repositório é público — obrigatória antes de commitar):**
o texto deve preservar formato, comprimento e pontuação, mas **nunca** conter
dado real sensível. Substituir por dígitos fictícios de mesmo comprimento:
OTP/códigos, links, linha digitável/código de barras, número/final de cartão,
agência/conta, CPF/CNPJ, nomes próprios e telefones. Valores monetários podem
ser trocados desde que o formato (`R$ 1.234,56`) se preserve. Os originais,
se precisarem ser guardados, ficam fora do repositório.

Para cada amostra, registrar: banco/cartão, **remetente como aparece no celular**
(número curto ou nome alfanumérico), tipo do evento e o texto (sanitizado).

## Cartão Amazon

### Fatura fechada

- Remetente: _(pendente — confirmar como aparece no celular)_
- Coletada em: 2026-07-13
- Evento: fatura fechada (vencimento, valor total, valor mínimo, linha digitável do boleto)
- Sanitização: valores e linha digitável substituídos por fictícios de mesmo formato/comprimento.

```
CARTAO AMAZON: FATURA VENCIMENTO DIA 15: NO VALOR DE R$ 135,79 VALOR MINIMO DE R$ 13,00. COD: 12345678901234567890123456789012345678901234567
```

Observações:
- Tudo em caixa alta, valores no formato `R$ 135,79`.
- O `COD:` é a linha digitável do boleto (47 dígitos).
- Não é uma transação: o gasto acontece quando a fatura é paga. Candidato a
  classificação automática como "fatura" (pendência informativa), não a transação.

## Itaú

### Pix recebido

- Remetente: `1482` (número curto)
- Coletada em: 2026-07-13
- Evento: Pix recebido (valor, nome do pagador, CPF mascarado pelo próprio banco)
- Sanitização: nome e dígitos visíveis do CPF substituídos por fictícios de mesmo comprimento.

```
Itau: Pix recebido no valor de R$ 98,74 de Maria, CPF XXX.123.456-XX.
```

Observações:
- Prefixo `Itau: ` (sem acento), valor no formato `R$ 98,74`.
- O CPF já vem mascarado pelo banco (`XXX.???.???-XX`) — só o miolo é visível.
- Evento de entrada: candidato a palpite `entrada` + valor + conta Itaú.
- Atenção: bancos costumam usar **vários números curtos** conforme o evento —
  registrar o remetente de cada nova amostra; a allowlist pode precisar de mais de um.

## Cobertura por banco (levantado em 2026-07-13)

Bancos do usuário: Nubank, Itaú e Banco do Brasil (além do Cartão Amazon acima).

| Banco | Canal de alerta de compra | Situação |
|---|---|---|
| Cartão Amazon | SMS (confirmado — amostra acima) | Falta amostra de **compra aprovada** e o remetente. |
| Itaú | SMS **ativo e confirmado** (amostra de Pix recebido acima, 2026-07-13) | Remetente `1482`. Coletar os demais eventos (compra, Pix enviado, TED) e seus remetentes. |
| Banco do Brasil | SMS disponível (aviso configurável no app) | Confirmar se o aviso por SMS está ativo; coletar amostras. |
| Nubank | **Só push do app** (SMS apenas para OTP) — confirmar no app de Mensagens | Fora da captura por SMS. Alternativa futura: `NotificationListenerService` (ver PLANEJAMENTO, fora de escopo da v1). |

## Pendente de coleta

- Cartão Amazon — SMS de **compra aprovada** (se existir; é o formato mais importante para a Fase 2) e o remetente da amostra de fatura.
- Itaú — compra no crédito/débito, Pix enviado, TED; registrar o remetente de cada um (Pix recebido já coletado, remetente `1482`).
- Banco do Brasil — compra no crédito/débito, Pix recebido/enviado, TED; registrar remetente.
- Nubank — confirmar no app de Mensagens que não há SMS de compra (só OTP).
