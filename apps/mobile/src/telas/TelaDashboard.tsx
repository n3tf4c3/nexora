import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { formatarCentavos } from '@nexora/core';
import { Cartao, CabecalhoEscuro, estilos as base } from '../componentes/Base';
import { IconeAjustes, IconeEntrada, IconeSaida } from '../componentes/Icones';
import { dashboardMock, recentesMock } from '../mock';
import { cores, fontes } from '../tema';

function caminhosGrafico(pontos: Array<[number, number]>) {
  const linha = pontos.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const [x0] = pontos[0];
  const [xn] = pontos[pontos.length - 1];
  return { linha, area: `${linha} L${xn},94 L${x0},94 Z` };
}

export function TelaDashboard({ aoAbrirCaptura }: { aoAbrirCaptura: () => void }) {
  const insets = useSafeAreaInsets();
  const d = dashboardMock;
  const { linha, area } = caminhosGrafico(d.grafico);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <CabecalhoEscuro>
        <Pressable style={[estilos.botaoAjustes, { top: insets.top + 20 }]} onPress={aoAbrirCaptura} hitSlop={8}>
          <IconeAjustes tamanho={18} cor={cores.brancoSuave} />
        </Pressable>
        <Text style={estilos.mes}>{d.mesLabel}</Text>
        <Text style={estilos.saldo}>{formatarCentavos(d.saldoCentavos)}</Text>
        <Text style={estilos.saldoLegenda}>Saldo do mês</Text>
      </CabecalhoEscuro>

      <View style={estilos.conteudo}>
        <View style={estilos.linhaCartoes}>
          <Cartao style={estilos.cartaoMetade}>
            <View style={[estilos.tileIcone, { backgroundColor: cores.entradaFundo }]}>
              <IconeEntrada tamanho={13} cor={cores.entrada} />
            </View>
            <Text style={estilos.kicker}>Entradas</Text>
            <Text style={estilos.valorCartao}>{formatarCentavos(d.entradasCentavos)}</Text>
          </Cartao>
          <Cartao style={estilos.cartaoMetade}>
            <View style={[estilos.tileIcone, { backgroundColor: cores.saidaFundo }]}>
              <IconeSaida tamanho={13} cor={cores.saida} />
            </View>
            <Text style={estilos.kicker}>Saídas</Text>
            <Text style={estilos.valorCartao}>{formatarCentavos(d.saidasCentavos)}</Text>
          </Cartao>
        </View>

        <Cartao>
          <View style={estilos.cabecalhoGrafico}>
            <Text style={base.tituloCartao}>Saldo acumulado</Text>
            <Text style={estilos.valorGrafico}>{formatarCentavos(d.saldoCentavos)}</Text>
          </View>
          <Svg viewBox="0 0 300 100" style={{ width: '100%', height: 90 }} preserveAspectRatio="none">
            <Path d={area} fill={cores.acento} opacity={0.12} />
            <Path d={linha} fill="none" stroke={cores.acento} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Cartao>

        <Cartao>
          <Text style={base.tituloCartao}>Gastos por categoria</Text>
          {d.categorias.map((cat, i) => (
            <View key={cat.nome} style={{ marginBottom: i === d.categorias.length - 1 ? 0 : 10 }}>
              <View style={estilos.linhaCategoria}>
                <Text style={estilos.textoCategoria}>{cat.nome}</Text>
                <Text style={estilos.pctCategoria}>{cat.pct}%</Text>
              </View>
              <View style={estilos.trilhaBarra}>
                <View style={[estilos.barra, { width: `${cat.pct}%` }]} />
              </View>
            </View>
          ))}
        </Cartao>

        <Cartao>
          <Text style={base.tituloCartao}>Transações recentes</Text>
          {recentesMock.map((tx, i) => (
            <View key={tx.id} style={[estilos.linhaTransacao, i === recentesMock.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={estilos.descricaoTransacao}>{tx.descricao}</Text>
              <Text style={[estilos.valorTransacao, { color: tx.tipo === 'entrada' ? cores.entrada : cores.saida }]}>
                {tx.tipo === 'entrada' ? '+ ' : '− '}
                {formatarCentavos(tx.valorCentavos)}
              </Text>
            </View>
          ))}
        </Cartao>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  botaoAjustes: {
    position: 'absolute',
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: cores.escuroSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mes: {
    fontSize: 12,
    color: cores.brancoFraco,
    marginBottom: 2,
  },
  saldo: {
    fontSize: 26,
    fontFamily: fontes.titulo,
    color: '#fff',
  },
  saldoLegenda: {
    fontSize: 12,
    color: cores.brancoFraco,
    marginTop: 4,
  },
  conteudo: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  linhaCartoes: {
    flexDirection: 'row',
    gap: 10,
  },
  cartaoMetade: {
    flex: 1,
    padding: 14,
  },
  tileIcone: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kicker: {
    fontSize: 11,
    color: cores.neutro600,
    marginBottom: 2,
  },
  valorCartao: {
    fontSize: 16,
    fontFamily: fontes.titulo,
    color: cores.texto,
  },
  cabecalhoGrafico: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  valorGrafico: {
    fontSize: 12,
    fontWeight: '700',
    color: cores.entrada,
  },
  linhaCategoria: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  textoCategoria: {
    fontSize: 12,
    color: cores.texto,
  },
  pctCategoria: {
    fontSize: 12,
    fontWeight: '700',
    color: cores.texto,
  },
  trilhaBarra: {
    height: 5,
    backgroundColor: cores.neutro200,
    borderRadius: 999,
  },
  barra: {
    height: '100%',
    backgroundColor: cores.acento,
    borderRadius: 999,
  },
  linhaTransacao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: cores.divisor,
  },
  descricaoTransacao: {
    fontSize: 13,
    color: cores.texto,
  },
  valorTransacao: {
    fontSize: 13,
    fontWeight: '700',
  },
});
