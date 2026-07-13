import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cartao, CabecalhoEscuro } from '../componentes/Base';
import { filaMock, type PendenciaMock } from '../mock';
import { cores, fontes } from '../tema';

/** Fila de confirmação (mock): confirmar/ignorar só remove da lista local. */
export function TelaFila() {
  const [itens, setItens] = useState<PendenciaMock[]>(filaMock);

  const remover = (id: string) => setItens((atual) => atual.filter((i) => i.id !== id));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <CabecalhoEscuro>
        <Text style={estilos.titulo}>Fila de confirmação</Text>
        <Text style={estilos.subtitulo}>
          {itens.length > 0 ? `${itens.length} SMS aguardando revisão` : 'Tudo revisado'}
        </Text>
      </CabecalhoEscuro>

      <View style={estilos.conteudo}>
        {itens.length === 0 && (
          <View style={estilos.vazio}>
            <Text style={estilos.vazioTexto}>Nenhuma pendência. Todos os SMS foram revisados.</Text>
          </View>
        )}

        {itens.map((item) => (
          <Cartao key={item.id}>
            <View style={estilos.cabecalhoItem}>
              <View>
                <Text style={estilos.remetente}>{item.remetente}</Text>
                <Text style={estilos.quando}>{item.quando}</Text>
              </View>
              <Text style={estilos.palpite}>{item.palpite ?? 'sem palpite'}</Text>
            </View>
            <Text style={estilos.texto}>"{item.texto}"</Text>
            <View style={estilos.acoes}>
              <Pressable style={estilos.botaoConfirmar} onPress={() => remover(item.id)}>
                <Text style={estilos.botaoConfirmarTexto}>Confirmar</Text>
              </Pressable>
              <Pressable style={estilos.botaoIgnorar} onPress={() => remover(item.id)}>
                <Text style={estilos.botaoIgnorarTexto}>Ignorar</Text>
              </Pressable>
            </View>
          </Cartao>
        ))}
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
  vazio: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: cores.neutro300,
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    backgroundColor: cores.superficie,
  },
  vazioTexto: {
    fontSize: 13,
    color: cores.neutro600,
    textAlign: 'center',
  },
  cabecalhoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  remetente: {
    fontSize: 14,
    fontWeight: '700',
    color: cores.texto,
  },
  quando: {
    fontSize: 11,
    color: cores.neutro600,
  },
  palpite: {
    fontSize: 11,
    fontWeight: '600',
    color: cores.neutro700,
    backgroundColor: cores.neutro100,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    maxWidth: 170,
    textAlign: 'right',
  },
  texto: {
    fontSize: 12,
    lineHeight: 18,
    color: cores.neutro700,
    backgroundColor: cores.neutro100,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  acoes: {
    flexDirection: 'row',
    gap: 8,
  },
  botaoConfirmar: {
    backgroundColor: cores.escuro,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  botaoConfirmarTexto: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  botaoIgnorar: {
    borderWidth: 1,
    borderColor: cores.divisor,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  botaoIgnorarTexto: {
    color: cores.texto,
    fontSize: 13,
    fontWeight: '600',
  },
});
