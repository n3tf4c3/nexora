import { useFonts, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TelaCaptura } from './src/telas/TelaCaptura';
import { cores } from './src/tema';

export default function App() {
  return (
    <SafeAreaProvider>
      <Raiz />
    </SafeAreaProvider>
  );
}

function Raiz() {
  const [fontesProntas, erroFontes] = useFonts({ Manrope_700Bold, Manrope_800ExtraBold });

  if (!fontesProntas && !erroFontes) {
    return (
      <View style={estilos.carregando} accessibilityRole="progressbar" accessibilityLabel="Carregando Nexora">
        <ActivityIndicator color={cores.acento} />
        <Text style={estilos.carregandoTexto}>Preparando captura...</Text>
      </View>
    );
  }

  return (
    <View style={estilos.raiz}>
      <TelaCaptura />
      <StatusBar style="light" />
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  carregando: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: cores.escuro,
  },
  carregandoTexto: {
    color: cores.brancoSuave,
    fontSize: 13,
  },
});
