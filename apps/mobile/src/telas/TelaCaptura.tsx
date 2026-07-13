import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
import { IconeVoltar } from '../componentes/Icones';
import { obterCapturaSms, type EstadoCaptura } from '../../modules/captura-sms/src/CapturaSmsModule';
import { cores, fontes } from '../tema';

const capturaSms = obterCapturaSms();

/** Configuração da captura de SMS — a única tela ligada ao módulo nativo. */
export function TelaCaptura({ aoVoltar }: { aoVoltar: () => void }) {
  const insets = useSafeAreaInsets();
  const [permissaoOk, setPermissaoOk] = useState(false);
  const [estado, setEstado] = useState<EstadoCaptura | null>(null);
  const [urlApi, setUrlApi] = useState('');
  const [token, setToken] = useState('');
  const [remetentes, setRemetentes] = useState('');

  const atualizarEstado = useCallback(() => {
    if (!capturaSms) return;
    const atual = capturaSms.obterEstado();
    setEstado(atual);
    setUrlApi(atual.urlApi ?? '');
    setRemetentes(atual.remetentes.join('\n'));
  }, []);

  useEffect(() => {
    atualizarEstado();
    if (Platform.OS === 'android') {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS).then(setPermissaoOk);
    }
  }, [atualizarEstado]);

  const pedirPermissao = async () => {
    const resultado = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS, {
      title: 'Leitura de SMS',
      message:
        'O Nexora lê SMS dos bancos configurados para registrar transações. ' +
        'Só remetentes da lista abaixo saem do aparelho.',
      buttonPositive: 'Permitir',
      buttonNegative: 'Agora não',
    });
    setPermissaoOk(resultado === PermissionsAndroid.RESULTS.GRANTED);
  };

  const salvar = () => {
    if (!capturaSms) return;
    const url = urlApi.trim();
    if (!url.startsWith('https://')) {
      Alert.alert('URL inválida', 'A URL da API deve começar com https://');
      return;
    }
    capturaSms.configurar(url, token);
    capturaSms.definirRemetentes(remetentes.split('\n'));
    setToken('');
    atualizarEstado();
    Alert.alert('Salvo', 'Configuração da captura atualizada.');
  };

  const sincronizar = () => {
    if (!capturaSms) return;
    capturaSms.sincronizarAgora();
    Alert.alert('Sincronização agendada', 'A fila será enviada assim que houver rede.');
    atualizarEstado();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
    <ScrollView style={{ flex: 1, backgroundColor: cores.fundo }} keyboardShouldPersistTaps="handled">
      <View style={[estilos.cabecalho, { paddingTop: insets.top + 16 }]}>
        <Pressable style={estilos.botaoVoltar} onPress={aoVoltar} hitSlop={8}>
          <IconeVoltar tamanho={18} cor={cores.brancoSuave} />
        </Pressable>
        <Text style={estilos.titulo}>Captura de SMS</Text>
        <Text style={estilos.subtitulo}>
          {Platform.OS === 'android'
            ? 'Só remetentes da lista saem do aparelho.'
            : 'Captura por SMS disponível apenas no Android.'}
        </Text>
      </View>

      <View style={estilos.conteudo}>
        {!capturaSms && (
          <View style={estilos.cartaoAviso}>
            <Text style={estilos.aviso}>
              Módulo de captura ausente neste binário (Expo Go?). Use o dev client buildado.
            </Text>
          </View>
        )}

        {capturaSms && !permissaoOk && (
          <View style={estilos.cartaoAviso}>
            <Text style={estilos.aviso}>Sem permissão de SMS, nada é capturado.</Text>
            <Pressable style={estilos.botao} onPress={pedirPermissao}>
              <Text style={estilos.botaoTexto}>Permitir leitura de SMS</Text>
            </Pressable>
          </View>
        )}

        {capturaSms && (
          <View>
            <Text style={estilos.rotulo}>URL da API</Text>
            <TextInput
              style={estilos.campo}
              value={urlApi}
              onChangeText={setUrlApi}
              placeholder="https://nexora-bay-mu.vercel.app"
              placeholderTextColor={cores.neutro500}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <Text style={estilos.rotulo}>Token de captura</Text>
            <TextInput
              style={estilos.campo}
              value={token}
              onChangeText={setToken}
              placeholder={estado?.temToken ? 'Já salvo — preencha só para trocar' : 'CAPTURA_SMS_TOKEN'}
              placeholderTextColor={cores.neutro500}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />

            <Text style={estilos.rotulo}>Remetentes permitidos (um por linha)</Text>
            <TextInput
              style={[estilos.campo, estilos.campoMultilinha]}
              value={remetentes}
              onChangeText={setRemetentes}
              placeholder={'ex.: 1482\n(vazio = nada é capturado)'}
              placeholderTextColor={cores.neutro500}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
            />
            <Text style={estilos.dica}>Lista vazia não captura nada; SMS pessoais nunca saem do aparelho.</Text>

            <Pressable style={estilos.botao} onPress={salvar}>
              <Text style={estilos.botaoTexto}>Salvar configuração</Text>
            </Pressable>

            <View style={estilos.estado}>
              <Text style={estilos.rotulo}>Estado</Text>
              <Text style={estilos.estadoLinha}>Token: {estado?.temToken ? 'salvo' : 'ausente'}</Text>
              <Text style={estilos.estadoLinha}>
                Remetentes salvos: {estado && estado.remetentes.length > 0 ? estado.remetentes.join(', ') : 'nenhum — nada será capturado'}
              </Text>
              <Text style={estilos.estadoLinha}>SMS aguardando envio: {estado?.pendentes ?? 0}</Text>
            </View>

            <Pressable style={[estilos.botao, estilos.botaoSecundario]} onPress={sincronizar}>
              <Text style={estilos.botaoTexto}>Sincronizar agora</Text>
            </Pressable>
            <Pressable style={[estilos.botao, estilos.botaoSecundario]} onPress={atualizarEstado}>
              <Text style={estilos.botaoTexto}>Atualizar estado</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  cabecalho: {
    backgroundColor: cores.escuro,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  botaoVoltar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: cores.escuroSuave,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
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
    paddingBottom: 40,
  },
  rotulo: {
    fontSize: 13,
    fontWeight: '600',
    color: cores.texto,
    marginTop: 12,
    marginBottom: 6,
  },
  campo: {
    borderWidth: 1,
    borderColor: cores.neutro300,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: cores.texto,
    backgroundColor: cores.superficie,
  },
  campoMultilinha: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  dica: {
    color: cores.neutro600,
    fontSize: 12,
    marginTop: 6,
  },
  cartaoAviso: {
    backgroundColor: '#FFF4E5',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 4,
  },
  aviso: {
    color: '#7A4D00',
    fontSize: 13,
  },
  botao: {
    backgroundColor: cores.escuro,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  botaoSecundario: {
    backgroundColor: cores.escuroSuave,
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  estado: {
    marginTop: 8,
  },
  estadoLinha: {
    fontSize: 13,
    color: cores.neutro700,
    marginTop: 2,
  },
});
