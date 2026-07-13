import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { cores } from '../tema';

/**
 * Marca Nexora: 3 barras ascendentes num tile arredondado (geometria do
 * handoff — viewBox 24, barras 4.2 de largura, alturas 8/13/18, rx 1.2).
 */
export function LogoNexora({ tamanho = 44, fundo = cores.escuroSuave }: { tamanho?: number; fundo?: string }) {
  const icone = tamanho * 0.5;
  return (
    <View
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho * 0.29,
        backgroundColor: fundo,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: tamanho * 0.2,
      }}
    >
      <Svg width={icone} height={icone} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="13" width="4.2" height="8" rx="1.2" fill="rgba(255,255,255,0.5)" />
        <Rect x="10" y="8" width="4.2" height="13" rx="1.2" fill="rgba(255,255,255,0.85)" />
        <Rect x="17" y="3" width="4.2" height="18" rx="1.2" fill={cores.acento2} />
      </Svg>
    </View>
  );
}
