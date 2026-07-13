import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatarCentavos } from '@nexora/core';
import { Cartao, CabecalhoEscuro } from '../componentes/Base';
import { transacoesMock } from '../mock';
import { cores, fontes } from '../tema';

export function TelaTransacoes() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <CabecalhoEscuro>
        <Text style={estilos.titulo}>Transações</Text>
        <Text style={estilos.subtitulo}>Julho de 2026</Text>
      </CabecalhoEscuro>

      <View style={estilos.conteudo}>
        <Cartao>
          {transacoesMock.map((tx, i) => (
            <View key={tx.id} style={[estilos.linha, i === transacoesMock.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={estilos.linhaTopo}>
                <Text style={estilos.descricao}>{tx.descricao}</Text>
                <Text style={[estilos.valor, { color: tx.tipo === 'entrada' ? cores.entrada : cores.saida }]}>
                  {tx.tipo === 'entrada' ? '+ ' : '− '}
                  {formatarCentavos(tx.valorCentavos)}
                </Text>
              </View>
              <Text style={estilos.meta}>
                {tx.data} · {tx.categoria} · {tx.conta}
              </Text>
            </View>
          ))}
        </Cartao>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  titulo: {
    fontFamily: fontes.titulo,
    fontSize: 22,
    color: '#fff',
  },
  subtitulo: {
    fontSize: 12,
    color: cores.brancoFraco,
    marginTop: 4,
  },
  conteudo: {
    padding: 16,
  },
  linha: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: cores.divisor,
  },
  linhaTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  descricao: {
    fontSize: 14,
    fontWeight: '600',
    color: cores.texto,
    flexShrink: 1,
  },
  valor: {
    fontSize: 13,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    color: cores.neutro600,
    marginTop: 2,
  },
});
