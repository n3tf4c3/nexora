import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { IconeContas, IconeDashboard, IconeFila, IconeTransacoes } from './src/componentes/Icones';
import { TelaCaptura } from './src/telas/TelaCaptura';
import { TelaContas } from './src/telas/TelaContas';
import { TelaDashboard } from './src/telas/TelaDashboard';
import { TelaFila } from './src/telas/TelaFila';
import { TelaLogin } from './src/telas/TelaLogin';
import { TelaTransacoes } from './src/telas/TelaTransacoes';
import { cores } from './src/tema';

type Aba = 'dashboard' | 'fila' | 'transacoes' | 'contas';

const abas: Array<{ id: Aba; rotulo: string; Icone: typeof IconeDashboard }> = [
  { id: 'dashboard', rotulo: 'Dashboard', Icone: IconeDashboard },
  { id: 'fila', rotulo: 'Fila', Icone: IconeFila },
  { id: 'transacoes', rotulo: 'Transações', Icone: IconeTransacoes },
  { id: 'contas', rotulo: 'Contas', Icone: IconeContas },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <Raiz />
    </SafeAreaProvider>
  );
}

function Raiz() {
  const insets = useSafeAreaInsets();
  const [fontesProntas] = useFonts({ Manrope_700Bold, Manrope_800ExtraBold });
  const [logado, setLogado] = useState(false);
  const [aba, setAba] = useState<Aba>('dashboard');
  const [capturaAberta, setCapturaAberta] = useState(false);

  if (!fontesProntas) {
    return <View style={{ flex: 1, backgroundColor: cores.escuro }} />;
  }

  if (!logado) {
    return (
      <View style={{ flex: 1 }}>
        <TelaLogin aoEntrar={() => setLogado(true)} />
        <StatusBar style="light" />
      </View>
    );
  }

  if (capturaAberta) {
    return (
      <View style={{ flex: 1 }}>
        <TelaCaptura aoVoltar={() => setCapturaAberta(false)} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <View style={{ flex: 1 }}>
        {aba === 'dashboard' && <TelaDashboard aoAbrirCaptura={() => setCapturaAberta(true)} />}
        {aba === 'fila' && <TelaFila />}
        {aba === 'transacoes' && <TelaTransacoes />}
        {aba === 'contas' && <TelaContas />}
      </View>

      <View style={[estilos.barraAbas, { paddingBottom: insets.bottom + 10 }]}>
        {abas.map(({ id, rotulo, Icone }) => {
          const ativa = aba === id;
          const cor = ativa ? cores.acento : cores.neutro500;
          return (
            <Pressable key={id} style={estilos.itemAba} onPress={() => setAba(id)}>
              <Icone tamanho={18} cor={cor} />
              <Text style={[estilos.rotuloAba, { color: cor }, ativa && estilos.rotuloAbaAtiva]}>{rotulo}</Text>
            </Pressable>
          );
        })}
      </View>
      <StatusBar style="light" />
    </View>
  );
}

const estilos = StyleSheet.create({
  barraAbas: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: cores.divisor,
    backgroundColor: cores.superficie,
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  itemAba: {
    alignItems: 'center',
    gap: 4,
    minWidth: 64,
  },
  rotuloAba: {
    fontSize: 10,
  },
  rotuloAbaAtiva: {
    fontWeight: '700',
  },
});
