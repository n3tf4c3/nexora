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

## Pendente de coleta

- Cartão Amazon — SMS de **compra aprovada** (se existir; é o formato mais importante para a Fase 2).
- Demais bancos/cartões do usuário — compra, Pix recebido/enviado, débito, TED.
