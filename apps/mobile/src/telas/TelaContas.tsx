import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cartao, CabecalhoEscuro, estilos as base } from '../componentes/Base';
import { categoriasMock, contasMock } from '../mock';
import { cores, fontes } from '../tema';

export function TelaContas() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <CabecalhoEscuro>
        <Text style={estilos.titulo}>Contas e categorias</Text>
        <Text style={estilos.subtitulo}>Estrutura do seu financeiro</Text>
      </CabecalhoEscuro>

      <View style={estilos.conteudo}>
        <Cartao>
          <Text style={base.tituloCartao}>Contas</Text>
          {contasMock.map((c, i) => (
            <View key={c.id} style={[estilos.linha, i === contasMock.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={estilos.nome}>{c.nome}</Text>
              <Text style={estilos.meta}>{c.tipoLabel}</Text>
              {c.detalhe && <Text style={estilos.meta}>{c.detalhe}</Text>}
            </View>
          ))}
        </Cartao>

        <Cartao>
          <Text style={base.tituloCartao}>Categorias</Text>
          <View style={estilos.chips}>
            {categoriasMock.map((cat) => (
              <View key={cat} style={estilos.chip}>
                <Text style={estilos.chipTexto}>{cat}</Text>
              </View>
            ))}
          </View>
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
  nome: {
    fontSize: 14,
    fontWeight: '700',
    color: cores.texto,
  },
  meta: {
    fontSize: 12,
    color: cores.neutro600,
    marginTop: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: cores.acentoSuave,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: cores.acento,
  },
});
