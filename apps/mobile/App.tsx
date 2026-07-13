import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { obterCapturaSms, type EstadoCaptura } from './modules/captura-sms/src/CapturaSmsModule';

const capturaSms = obterCapturaSms();

export default function App() {
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

  if (!capturaSms) {
    return (
      <View style={styles.centro}>
        <Text style={styles.titulo}>Nexora</Text>
        <Text style={styles.aviso}>
          Módulo de captura ausente neste binário (Expo Go?). Use o dev client buildado.
        </Text>
        <StatusBar style="auto" />
      </View>
    );
  }
  const nativo = capturaSms;

  const pedirPermissao = async () => {
    const resultado = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      {
        title: 'Leitura de SMS',
        message:
          'O Nexora lê SMS dos bancos configurados para registrar transações. ' +
          'Só remetentes da lista abaixo saem do aparelho.',
        buttonPositive: 'Permitir',
        buttonNegative: 'Agora não',
      },
    );
    setPermissaoOk(resultado === PermissionsAndroid.RESULTS.GRANTED);
  };

  const salvar = () => {
    const url = urlApi.trim();
    if (!url.startsWith('https://')) {
      Alert.alert('URL inválida', 'A URL da API deve começar com https://');
      return;
    }
    nativo.configurar(url, token);
    nativo.definirRemetentes(remetentes.split('\n'));
    setToken('');
    atualizarEstado();
    Alert.alert('Salvo', 'Configuração da captura atualizada.');
  };

  const sincronizar = () => {
    nativo.sincronizarAgora();
    Alert.alert('Sincronização agendada', 'A fila será enviada assim que houver rede.');
    atualizarEstado();
  };

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <Text style={styles.titulo}>Nexora — Captura de SMS</Text>

      {!permissaoOk && (
        <View style={styles.cartaoAviso}>
          <Text style={styles.aviso}>Sem permissão de SMS, nada é capturado.</Text>
          <Pressable style={styles.botao} onPress={pedirPermissao}>
            <Text style={styles.botaoTexto}>Permitir leitura de SMS</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.rotulo}>URL da API</Text>
      <TextInput
        style={styles.campo}
        value={urlApi}
        onChangeText={setUrlApi}
        placeholder="https://nexora-bay-mu.vercel.app"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      <Text style={styles.rotulo}>Token de captura</Text>
      <TextInput
        style={styles.campo}
        value={token}
        onChangeText={setToken}
        placeholder={estado?.temToken ? 'Já salvo — preencha só para trocar' : 'CAPTURA_SMS_TOKEN'}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
      />

      <Text style={styles.rotulo}>Remetentes permitidos (um por linha)</Text>
      <TextInput
        style={[styles.campo, styles.campoMultilinha]}
        value={remetentes}
        onChangeText={setRemetentes}
        placeholder={'Itau\nBB\nAmazon'}
        autoCapitalize="none"
        autoCorrect={false}
        multiline
      />
      <Text style={styles.dica}>Lista vazia não captura nada; SMS pessoais nunca saem do aparelho.</Text>

      <Pressable style={styles.botao} onPress={salvar}>
        <Text style={styles.botaoTexto}>Salvar configuração</Text>
      </Pressable>

      <View style={styles.estado}>
        <Text style={styles.rotulo}>Estado</Text>
        <Text>Token: {estado?.temToken ? 'salvo' : 'ausente'}</Text>
        <Text>SMS aguardando envio: {estado?.pendentes ?? 0}</Text>
      </View>

      <Pressable style={[styles.botao, styles.botaoSecundario]} onPress={sincronizar}>
        <Text style={styles.botaoTexto}>Sincronizar agora</Text>
      </Pressable>
      <Pressable style={[styles.botao, styles.botaoSecundario]} onPress={atualizarEstado}>
        <Text style={styles.botaoTexto}>Atualizar estado</Text>
      </Pressable>

      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: '#fff',
  },
  conteudo: {
    padding: 24,
    paddingTop: 64,
    gap: 8,
  },
  centro: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  rotulo: {
    fontWeight: '600',
    marginTop: 8,
  },
  campo: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  campoMultilinha: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  dica: {
    color: '#666',
    fontSize: 12,
  },
  cartaoAviso: {
    backgroundColor: '#FFF4E5',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  aviso: {
    color: '#7A4D00',
  },
  botao: {
    backgroundColor: '#1D4ED8',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  botaoSecundario: {
    backgroundColor: '#475569',
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: '600',
  },
  estado: {
    marginTop: 8,
    gap: 2,
  },
});
