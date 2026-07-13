// Dados de exemplo do handoff de design — a integração com a API vem depois.
// Valores em centavos (padrão do @nexora/core).

export type TransacaoMock = {
  id: string;
  data: string;
  tipo: 'entrada' | 'saida';
  valorCentavos: number;
  conta: string;
  categoria: string;
  descricao: string;
};

export const dashboardMock = {
  mesLabel: 'Julho de 2026',
  saldoCentavos: 429_080,
  entradasCentavos: 680_000,
  saidasCentavos: 250_920,
  // Pontos do gráfico "Saldo acumulado" (viewBox 300x100 do design).
  grafico: [
    [6, 80],
    [80, 60],
    [150, 68],
    [220, 30],
    [294, 18],
  ] as Array<[number, number]>,
  categorias: [
    { nome: 'Moradia', pct: 44 },
    { nome: 'Alimentação', pct: 27 },
    { nome: 'Transporte', pct: 16 },
  ],
};

export const transacoesMock: TransacaoMock[] = [
  { id: 't20', data: '10/07/2026', tipo: 'entrada', valorCentavos: 30_000, conta: 'Carteira', categoria: '—', descricao: 'Venda de usado' },
  { id: 't19', data: '09/07/2026', tipo: 'saida', valorCentavos: 6_180, conta: 'C6 Bank', categoria: 'Transporte', descricao: 'Uber' },
  { id: 't18', data: '08/07/2026', tipo: 'saida', valorCentavos: 21_000, conta: 'Carteira', categoria: 'Lazer', descricao: 'Cinema e jantar' },
  { id: 't17', data: '07/07/2026', tipo: 'saida', valorCentavos: 3_990, conta: 'Nubank', categoria: 'Assinaturas', descricao: 'Spotify' },
  { id: 't16', data: '05/07/2026', tipo: 'saida', valorCentavos: 14_500, conta: 'C6 Bank', categoria: 'Transporte', descricao: 'Combustível' },
  { id: 't15', data: '04/07/2026', tipo: 'saida', valorCentavos: 8_990, conta: 'Nubank', categoria: 'Alimentação', descricao: 'Padaria Bom Pão' },
  { id: 't14', data: '03/07/2026', tipo: 'entrada', valorCentavos: 650_000, conta: 'Itaú', categoria: '—', descricao: 'Salário' },
  { id: 't13', data: '02/07/2026', tipo: 'saida', valorCentavos: 32_050, conta: 'Nubank', categoria: 'Alimentação', descricao: 'Supermercado Extra' },
  { id: 't12', data: '01/07/2026', tipo: 'saida', valorCentavos: 185_000, conta: 'Itaú', categoria: 'Moradia', descricao: 'Aluguel' },
];

export const recentesMock = transacoesMock.slice(6);

export type PendenciaMock = {
  id: string;
  remetente: string;
  quando: string;
  texto: string;
  palpite: string | null;
};

export const filaMock: PendenciaMock[] = [
  {
    id: 'q1',
    remetente: 'Nubank',
    quando: 'Hoje, 08:12',
    texto: 'Nubank: compra aprovada R$ 89,90 em PADARIA BOM PAO, 12/07 às 08:12, cartão final 4521.',
    palpite: '− R$ 89,90 · saída · Nubank',
  },
  {
    id: 'q2',
    remetente: 'Itaú',
    quando: 'Ontem, 14:03',
    texto: 'Itaú: Você recebeu um Pix de MARIA J SILVA no valor de R$ 1.200,00 em 11/07 às 14:03.',
    palpite: '+ R$ 1.200,00 · entrada · Itaú',
  },
  {
    id: 'q3',
    remetente: '41279',
    quando: 'Ontem, 19:47',
    texto: 'Compra aprovada: R$ 45,00. Estabelecimento não identificado. Cartão final 0012.',
    palpite: 'R$ 45,00 detectado, resto incerto',
  },
  {
    id: 'q4',
    remetente: 'Sicoob',
    quando: 'Há 2 dias',
    texto: 'Sicoob Informa: sua fatura do cartão fecha em 3 dias. Dúvidas, acesse o app.',
    palpite: null,
  },
];

export type ContaMock = { id: string; nome: string; tipoLabel: string; detalhe?: string };

export const contasMock: ContaMock[] = [
  { id: 'nu', nome: 'Nubank', tipoLabel: 'Cartão de crédito', detalhe: 'Fecha dia 3, vence dia 10.' },
  { id: 'ita', nome: 'Itaú', tipoLabel: 'Conta corrente' },
  { id: 'c6', nome: 'C6 Bank', tipoLabel: 'Cartão de crédito', detalhe: 'Fecha dia 25, vence dia 5.' },
  { id: 'cart', nome: 'Carteira', tipoLabel: 'Dinheiro' },
];

export const categoriasMock = ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Assinaturas'];
