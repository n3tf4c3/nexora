import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { cores, fontes } from '../tema';
import { LogoNexora } from './LogoNexora';

/** Cartão branco padrão do design (raio 14, borda divisor). */
export function Cartao({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[estilos.cartao, style]}>{children}</View>;
}

/**
 * Cabeçalho escuro com cantos inferiores arredondados — padrão das telas
 * mobile do design. O padding superior folga a status bar (edge-to-edge).
 */
export function CabecalhoEscuro({ children }: { children?: React.ReactNode }) {
  return (
    <View style={estilos.cabecalho}>
      <View style={estilos.cabecalhoMarca}>
        <LogoNexora tamanho={32} />
        <Text style={estilos.cabecalhoWordmark}>Nexora</Text>
      </View>
      {children}
    </View>
  );
}

export const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.divisor,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  cabecalho: {
    backgroundColor: cores.escuro,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  cabecalhoMarca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  cabecalhoWordmark: {
    fontFamily: fontes.titulo,
    fontSize: 16,
    color: '#fff',
  },
  tituloCartao: {
    fontSize: 13,
    fontWeight: '700',
    color: cores.texto,
    marginBottom: 12,
  },
});
