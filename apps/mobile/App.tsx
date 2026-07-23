import { useFonts, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { TelaCaptura } from './src/telas/TelaCaptura';
import { cores, fontes } from './src/tema';
import { obterCapturaSms } from './modules/captura-sms/src/CapturaSmsModule';
import { LogoNexora } from './src/componentes/LogoNexora';

const capturaSms = obterCapturaSms();

export default function App() {
  return (
    <SafeAreaProvider>
      <Raiz />
    </SafeAreaProvider>
  );
}

function extrairUrlWeb(urlApi: string | null | undefined): string | null {
  if (!urlApi) return null;
  try {
    const url = new URL(urlApi);
    return `${url.protocol}//${url.host}`;
  } catch {
    // Se não for uma URL completa Válida, limpa caminhos conhecidos
    const limpo = urlApi.replace(/\/api\/.*$/, '').replace(/\/+$/, '');
    if (limpo.startsWith('http://') || limpo.startsWith('https://')) {
      return limpo;
    }
    return null;
  }
}

function Raiz() {
  const insets = useSafeAreaInsets();
  const [fontesProntas, erroFontes] = useFonts({ Manrope_700Bold, Manrope_800ExtraBold });
  const [abaAtiva, setAbaAtiva] = useState<'web' | 'captura'>('web');
  const [urlWeb, setUrlWeb] = useState<string | null>(null);

  const atualizarConfiguracao = useCallback(() => {
    if (!capturaSms) return;
    try {
      const estado = capturaSms.obterEstado();
      const webUrl = extrairUrlWeb(estado.urlApi);
      setUrlWeb(webUrl);
    } catch {
      // Se módulo não estiver disponível
    }
  }, []);

  useEffect(() => {
    atualizarConfiguracao();
  }, [atualizarConfiguracao, abaAtiva]);

  if (!fontesProntas && !erroFontes) {
    return (
      <View style={estilos.carregando} accessibilityRole="progressbar" accessibilityLabel="Carregando Nexora">
        <ActivityIndicator color={cores.acento} />
        <Text style={estilos.carregandoTexto}>Iniciando Nexora...</Text>
      </View>
    );
  }

  return (
    <View style={estilos.raiz}>
      <StatusBar style="light" />

      {/* Conteúdo Principal */}
      <View style={estilos.conteudo}>
        {abaAtiva === 'web' ? (
          urlWeb ? (
            <View style={[estilos.areaWeb, { paddingTop: insets.top }]}>
              <WebView
                source={{ uri: urlWeb }}
                style={estilos.webView}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={estilos.carregandoWeb}>
                    <ActivityIndicator size="large" color={cores.acento} />
                  </View>
                )}
              />
            </View>
          ) : (
            <View style={[estilos.semWeb, { paddingTop: insets.top + 20 }]}>
              <LogoNexora tamanho={64} />
              <Text style={estilos.semWebTitulo}>Bem-vindo ao Nexora</Text>
              <Text style={estilos.semWebSubtitulo}>
                Para acessar o Dashboard e sincronizar suas finanças, configure o endereço da API na aba de Captura.
              </Text>
              <Pressable
                style={estilos.botaoConfigurar}
                onPress={() => setAbaAtiva('captura')}
              >
                <Text style={estilos.botaoConfigurarTexto}>Configurar API & Captura</Text>
              </Pressable>
            </View>
          )
        ) : (
          <TelaCaptura />
        )}
      </View>

      {/* Barra de Navegação Inferior (Bottom Navigation) */}
      <View style={[estilos.barraNavegacao, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <Pressable
          style={[estilos.itemNavegacao, abaAtiva === 'web' && estilos.itemNavegacaoAtivo]}
          onPress={() => setAbaAtiva('web')}
        >
          <Text style={[estilos.iconeAba, abaAtiva === 'web' && estilos.iconeAbaAtivo]}>📊</Text>
          <Text style={[estilos.rotuloAba, abaAtiva === 'web' && estilos.rotuloAbaAtivo]}>Dashboard</Text>
        </Pressable>

        <Pressable
          style={[estilos.itemNavegacao, abaAtiva === 'captura' && estilos.itemNavegacaoAtivo]}
          onPress={() => setAbaAtiva('captura')}
        >
          <Text style={[estilos.iconeAba, abaAtiva === 'captura' && estilos.iconeAbaAtivo]}>⚡</Text>
          <Text style={[estilos.rotuloAba, abaAtiva === 'captura' && estilos.rotuloAbaAtivo]}>Captura SMS</Text>
        </Pressable>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  conteudo: {
    flex: 1,
  },
  areaWeb: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  webView: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  carregandoWeb: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#090d16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  semWeb: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#090d16',
  },
  semWebTitulo: {
    fontFamily: fontes.titulo,
    fontSize: 22,
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  semWebSubtitulo: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  botaoConfigurar: {
    backgroundColor: '#6366f1',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  botaoConfigurarTexto: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  carregando: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#090d16',
  },
  carregandoTexto: {
    color: '#94a3b8',
    fontSize: 13,
  },
  barraNavegacao: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 10,
  },
  itemNavegacao: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  itemNavegacaoAtivo: {},
  iconeAba: {
    fontSize: 18,
    opacity: 0.5,
    marginBottom: 2,
  },
  iconeAbaAtivo: {
    opacity: 1,
  },
  rotuloAba: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  rotuloAbaAtivo: {
    color: '#6366f1',
    fontWeight: '800',
  },
});
