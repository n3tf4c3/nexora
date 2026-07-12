import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { formatarCentavos } from '@nexora/core';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Nexora</Text>
      <Text>Esqueleto ok — core integrado: {formatarCentavos(0)}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '600',
  },
});
