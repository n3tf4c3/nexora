// Limites canônicos — espelhados nos varchar/CHECKs do banco. Nunca redeclarar.

export const NOME_CONTA_MAX = 60;
export const NOME_CATEGORIA_MAX = 40;
export const DESCRICAO_TRANSACAO_MAX = 200;

// Captura de SMS (Fase 2).
export const REMETENTE_SMS_MAX = 40;
// SMS longo chega concatenado pelo Android; margem folgada sobre os 160 clássicos.
export const CORPO_SMS_MAX = 2000;
export const LOTE_CAPTURA_MAX = 50;
