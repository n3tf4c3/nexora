import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  obterCapturaSms,
  type EstadoCaptura,
  type ResultadoTesteConexao,
} from '../../modules/captura-sms/src/CapturaSmsModule';
import { LogoNexora } from '../componentes/LogoNexora';
import { cores, fontes } from '../tema';

const capturaSms = obterCapturaSms();

const mensagensErro: Record<string, string> = {
  configuracao: 'URL ou token ausente. Revise a configuração.',
  credencial: 'Token recusado pelo servidor. Gere e salve uma credencial válida.',
  limite: 'Muitas tentativas. O envio será repetido automaticamente.',
  payload: 'O servidor recusou uma mensagem da fila. Revise a versão do app e da API.',
  rede: 'Não foi possível alcançar a API. A fila continua protegida no aparelho.',
  servidor: 'A API está indisponível. O envio será repetido automaticamente.',
  http: 'A API respondeu com um status inesperado.',
};

function formatarInstante(instanteMs: number | null | undefined): string {
  if (!instanteMs) return 'ainda não registrado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(instanteMs));
}

function formatarIdade(instanteMs: number | null | undefined): string {
  if (!instanteMs) return 'sem pendências';
  const minutos = Math.max(0, Math.floor((Date.now() - instanteMs) / 60_000));
  if (minutos < 1) return 'menos de 1 minuto';
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas} h`;
  return `${Math.floor(horas / 24)} d`;
}

function textoTeste(resultado: ResultadoTesteConexao): string {
  if (resultado.ok) return 'API e credencial responderam corretamente.';
  const detalhe = resultado.codigo ? mensagensErro[resultado.codigo] : null;
  const status = resultado.statusHttp ? ` HTTP ${resultado.statusHttp}.` : '';
  return `${detalhe ?? 'Não foi possível validar a conexão.'}${status}`;
}

/** Central operacional do capturador Android. Dados financeiros continuam no web. */
export function TelaCaptura() {
  const insets = useSafeAreaInsets();
  const [permissao, setPermissao] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoCaptura | null>(null);
  const [urlApi, setUrlApi] = useState('');
  const [token, setToken] = useState('');
  const [remetentes, setRemetentes] = useState('');
  const [erroTela, setErroTela] = useState<string | null>(null);
  const [testando, setTestando] = useState(false);

  const atualizarEstado = useCallback(() => {
    if (!capturaSms) return;
    try {
      const atual = capturaSms.obterEstado();
      setEstado(atual);
      setUrlApi(atual.urlApi ?? '');
      setRemetentes(atual.remetentes.join('\n'));
      setErroTela(null);
    } catch {
      setErroTela('Não foi possível consultar o módulo de captura. Reabra o aplicativo.');
    }
  }, []);

  const verificarPermissao = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    try {
      const concedida = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
      setPermissao((atual) =>
        concedida
          ? PermissionsAndroid.RESULTS.GRANTED
          : atual === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
            ? atual
            : PermissionsAndroid.RESULTS.DENIED,
      );
    } catch {
      setErroTela('Não foi possível consultar a permissão de SMS.');
    }
  }, []);

  useEffect(() => {
    atualizarEstado();
    void verificarPermissao();
    const assinatura = AppState.addEventListener('change', (proximoEstado) => {
      if (proximoEstado === 'active') {
        atualizarEstado();
        void verificarPermissao();
      }
    });
    return () => assinatura.remove();
  }, [atualizarEstado, verificarPermissao]);

  const pedirPermissao = async () => {
    try {
      const resultado = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS, {
        title: 'Captura de SMS bancário',
        message:
          'O Nexora captura somente SMS dos remetentes permitidos abaixo. ' +
          'Mensagens pessoais não saem do aparelho.',
        buttonPositive: 'Permitir',
        buttonNegative: 'Agora não',
      });
      setPermissao(resultado);
    } catch {
      setErroTela('Não foi possível solicitar a permissão de SMS.');
    }
  };

  const salvar = () => {
    if (!capturaSms) return;
    const url = urlApi.trim();
    if (!url.startsWith('https://')) {
      Alert.alert('URL inválida', 'A URL da API deve começar com https://');
      return;
    }
    if (!estado?.temToken && !token.trim()) {
      Alert.alert('Token obrigatório', 'Informe o token de captura na primeira configuração.');
      return;
    }

    try {
      capturaSms.configurar(url, token);
      capturaSms.definirRemetentes(remetentes.split('\n'));
      setToken('');
      atualizarEstado();
      Alert.alert('Configuração salva', 'A captura usará esta API e esta lista de remetentes.');
    } catch {
      setErroTela('Não foi possível salvar a configuração.');
    }
  };

  const sincronizar = () => {
    if (!capturaSms) return;
    try {
      capturaSms.sincronizarAgora();
      Alert.alert('Envio solicitado', 'O Android enviará a fila quando houver rede. Acompanhe o estado abaixo.');
      atualizarEstado();
    } catch {
      setErroTela('Não foi possível agendar o envio da fila.');
    }
  };

  const testarConexao = async () => {
    if (!capturaSms || testando) return;
    setTestando(true);
    try {
      const resultado = await capturaSms.testarConexao();
      Alert.alert(resultado.ok ? 'Conexão aprovada' : 'Conexão não aprovada', textoTeste(resultado));
    } catch {
      Alert.alert('Teste indisponível', 'Recompile o dev client para atualizar o módulo nativo.');
    } finally {
      setTestando(false);
      atualizarEstado();
    }
  };

  const configurada = Boolean(estado?.urlApi && estado.temToken && estado.remetentes.length > 0);
  const permissaoOk = permissao === PermissionsAndroid.RESULTS.GRANTED;
  const erroOperacional = estado?.ultimoErroCodigo
    ? mensagensErro[estado.ultimoErroCodigo] ?? mensagensErro.http
    : null;
  const saudavel = Boolean(capturaSms && configurada && permissaoOk && !erroOperacional);

  return (
    <KeyboardAvoidingView style={estilos.raiz} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={estilos.raiz}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[estilos.cabecalho, { paddingTop: insets.top + 20 }]}>
          <View style={estilos.marca}>
            <LogoNexora tamanho={38} />
            <View>
              <Text style={estilos.wordmark}>Nexora</Text>
              <Text style={estilos.marcaDescricao}>Capturador Android</Text>
            </View>
          </View>
          <Text style={estilos.titulo}>Sua ponte financeira está {saudavel ? 'ativa' : 'em atenção'}.</Text>
          <Text style={estilos.subtitulo}>
            O app captura e sincroniza. A revisão e a gestão continuam no cockpit web.
          </Text>
        </View>

        <View style={estilos.conteudo}>
          <View style={[estilos.cartaoStatus, saudavel ? estilos.statusOk : estilos.statusAtencao]}>
            <View style={estilos.statusCabecalho}>
              <View style={[estilos.pontoStatus, saudavel ? estilos.pontoOk : estilos.pontoAtencao]} />
              <Text style={estilos.statusTitulo}>{saudavel ? 'Captura pronta' : 'Ação necessária'}</Text>
            </View>
            <Text style={estilos.statusTexto}>
              {!capturaSms
                ? 'Este binário não contém o módulo nativo. Use um dev client do Nexora.'
                : !permissaoOk
                  ? 'Conceda a permissão para receber novos SMS bancários.'
                  : !configurada
                    ? 'Complete URL, token e ao menos um remetente permitido.'
                    : erroOperacional ?? 'Permissão, credencial e remetentes estão configurados.'}
            </Text>
          </View>

          {erroTela && (
            <View style={estilos.alerta} accessibilityRole="alert">
              <Text style={estilos.alertaTexto}>{erroTela}</Text>
            </View>
          )}

          {capturaSms && !permissaoOk && (
            <View style={estilos.cartao}>
              <Text style={estilos.tituloSecao}>Permissão do Android</Text>
              <Text style={estilos.textoSecao}>
                Sem a permissão RECEIVE_SMS, o sistema não entrega novos SMS ao capturador.
              </Text>
              {permissao === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? (
                <Pressable
                  style={estilos.botaoPrimario}
                  onPress={() => void Linking.openSettings()}
                  accessibilityRole="button"
                >
                  <Text style={estilos.botaoPrimarioTexto}>Abrir configurações do Android</Text>
                </Pressable>
              ) : (
                <Pressable style={estilos.botaoPrimario} onPress={pedirPermissao} accessibilityRole="button">
                  <Text style={estilos.botaoPrimarioTexto}>Permitir captura de SMS</Text>
                </Pressable>
              )}
            </View>
          )}

          {capturaSms && (
            <>
              <View style={estilos.gradeMetricas}>
                <View style={estilos.metrica}>
                  <Text style={estilos.metricaValor}>{estado?.pendentes ?? 0}</Text>
                  <Text style={estilos.metricaRotulo}>na fila local</Text>
                </View>
                <View style={estilos.metrica}>
                  <Text style={estilos.metricaValor}>{formatarIdade(estado?.pendenteMaisAntigoEmMs)}</Text>
                  <Text style={estilos.metricaRotulo}>pendência mais antiga</Text>
                </View>
              </View>

              <View style={estilos.cartao}>
                <Text style={estilos.tituloSecao}>Pulso da captura</Text>
                <LinhaEstado rotulo="Último SMS elegível" valor={formatarInstante(estado?.ultimoSmsRecebidoEmMs)} />
                <LinhaEstado rotulo="Última tentativa" valor={formatarInstante(estado?.ultimaTentativaEmMs)} />
                <LinhaEstado rotulo="Último envio concluído" valor={formatarInstante(estado?.ultimoSucessoEmMs)} />
                <LinhaEstado
                  rotulo="Falhas consecutivas"
                  valor={String(estado?.falhasConsecutivas ?? 0)}
                />
                {estado?.ultimoStatusHttp && (
                  <LinhaEstado rotulo="Último status HTTP" valor={String(estado.ultimoStatusHttp)} />
                )}
                {erroOperacional && (
                  <View style={estilos.erroOperacional} accessibilityRole="alert">
                    <Text style={estilos.erroOperacionalTitulo}>Último erro</Text>
                    <Text style={estilos.erroOperacionalTexto}>{erroOperacional}</Text>
                    <Text style={estilos.erroOperacionalData}>{formatarInstante(estado?.ultimoErroEmMs)}</Text>
                  </View>
                )}
                <View style={estilos.acoesLinha}>
                  <Pressable
                    style={[estilos.botaoSecundario, testando && estilos.botaoDesabilitado]}
                    onPress={() => void testarConexao()}
                    disabled={testando}
                    accessibilityRole="button"
                    accessibilityState={{ busy: testando, disabled: testando }}
                  >
                    {testando ? (
                      <ActivityIndicator color={cores.escuro} />
                    ) : (
                      <Text style={estilos.botaoSecundarioTexto}>Testar conexão</Text>
                    )}
                  </Pressable>
                  <Pressable style={estilos.botaoSecundario} onPress={sincronizar} accessibilityRole="button">
                    <Text style={estilos.botaoSecundarioTexto}>Enviar fila</Text>
                  </Pressable>
                </View>
                <Pressable style={estilos.botaoTexto} onPress={atualizarEstado} accessibilityRole="button">
                  <Text style={estilos.botaoTextoRotulo}>Atualizar diagnóstico</Text>
                </Pressable>
              </View>

              <View style={estilos.cartao}>
                <Text style={estilos.tituloSecao}>Configuração segura</Text>
                <Text style={estilos.textoSecao}>
                  O token é cifrado com uma chave não extraível do Android Keystore.
                </Text>

                <Text style={estilos.rotulo}>URL da API</Text>
                <TextInput
                  style={estilos.campo}
                  value={urlApi}
                  onChangeText={setUrlApi}
                  placeholder="https://seu-dominio.vercel.app"
                  placeholderTextColor={cores.neutro500}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="url"
                  keyboardType="url"
                  accessibilityLabel="URL da API"
                />

                <Text style={estilos.rotulo}>Token de captura</Text>
                <TextInput
                  style={estilos.campo}
                  value={token}
                  onChangeText={setToken}
                  placeholder={estado?.temToken ? 'Já salvo. Preencha somente para trocar.' : 'Token obrigatório'}
                  placeholderTextColor={cores.neutro500}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  secureTextEntry
                  accessibilityLabel="Token de captura"
                />

                <Text style={estilos.rotulo}>Remetentes permitidos</Text>
                <TextInput
                  style={[estilos.campo, estilos.campoMultilinha]}
                  value={remetentes}
                  onChangeText={setRemetentes}
                  placeholder={'Um remetente exato por linha\nExemplo: 1482'}
                  placeholderTextColor={cores.neutro500}
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                  accessibilityLabel="Remetentes permitidos, um por linha"
                />
                <Text style={estilos.dica}>
                  A comparação é exata, sem diferenciar maiúsculas. Lista vazia não captura nada.
                </Text>

                <Pressable style={estilos.botaoPrimario} onPress={salvar} accessibilityRole="button">
                  <Text style={estilos.botaoPrimarioTexto}>Salvar configuração</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function LinhaEstado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.linhaEstado}>
      <Text style={estilos.linhaRotulo}>{rotulo}</Text>
      <Text style={estilos.linhaValor}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  cabecalho: {
    backgroundColor: cores.escuro,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  wordmark: {
    fontFamily: fontes.titulo,
    fontSize: 17,
    color: '#fff',
  },
  marcaDescricao: {
    color: cores.brancoFraco,
    fontSize: 11,
    marginTop: 1,
  },
  titulo: {
    maxWidth: 330,
    fontFamily: fontes.titulo,
    fontSize: 26,
    lineHeight: 32,
    color: '#fff',
  },
  subtitulo: {
    maxWidth: 340,
    color: cores.brancoSuave,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  conteudo: {
    padding: 16,
  },
  cartao: {
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.divisor,
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
  },
  cartaoStatus: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  statusOk: {
    backgroundColor: cores.entradaFundo,
    borderColor: '#b8dfc3',
  },
  statusAtencao: {
    backgroundColor: '#fff6e7',
    borderColor: '#ead29f',
  },
  statusCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pontoStatus: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  pontoOk: {
    backgroundColor: cores.entrada,
  },
  pontoAtencao: {
    backgroundColor: '#9a6400',
  },
  statusTitulo: {
    color: cores.texto,
    fontWeight: '800',
    fontSize: 14,
  },
  statusTexto: {
    color: cores.neutro700,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  alerta: {
    backgroundColor: cores.saidaFundo,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  alertaTexto: {
    color: cores.saida,
    fontSize: 13,
  },
  gradeMetricas: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  metrica: {
    flex: 1,
    minHeight: 92,
    justifyContent: 'space-between',
    backgroundColor: cores.escuro,
    borderRadius: 16,
    padding: 14,
  },
  metricaValor: {
    color: '#fff',
    fontFamily: fontes.tituloMedio,
    fontSize: 20,
  },
  metricaRotulo: {
    color: cores.brancoSuave,
    fontSize: 11,
    lineHeight: 15,
  },
  tituloSecao: {
    color: cores.texto,
    fontFamily: fontes.tituloMedio,
    fontSize: 15,
  },
  textoSecao: {
    color: cores.neutro600,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  linhaEstado: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: cores.divisor,
    paddingVertical: 11,
  },
  linhaRotulo: {
    flex: 1,
    color: cores.neutro600,
    fontSize: 12,
  },
  linhaValor: {
    flex: 1.25,
    color: cores.texto,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  erroOperacional: {
    backgroundColor: cores.saidaFundo,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  erroOperacionalTitulo: {
    color: cores.saida,
    fontWeight: '800',
    fontSize: 12,
  },
  erroOperacionalTexto: {
    color: '#77111a',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  erroOperacionalData: {
    color: '#8d3d43',
    fontSize: 11,
    marginTop: 5,
  },
  acoesLinha: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  botaoPrimario: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.acento,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  botaoPrimarioTexto: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'center',
  },
  botaoSecundario: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: cores.divisor,
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  botaoSecundarioTexto: {
    color: '#818cf8',
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
  },
  botaoDesabilitado: {
    opacity: 0.65,
  },
  botaoTexto: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  botaoTextoRotulo: {
    color: cores.neutro500,
    fontWeight: '700',
    fontSize: 12,
  },
  rotulo: {
    color: cores.texto,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  campo: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: cores.divisor,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: cores.texto,
    backgroundColor: '#090d16',
    fontSize: 13,
  },
  campoMultilinha: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  dica: {
    color: cores.neutro500,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
});
