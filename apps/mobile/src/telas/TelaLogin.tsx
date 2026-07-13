import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoNexora } from '../componentes/LogoNexora';
import { cores, fontes } from '../tema';

/** Login do design (mock): "Entrar" só avança — a autenticação real vem com a API. */
export function TelaLogin({ aoEntrar }: { aoEntrar: () => void }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
    <ScrollView style={estilos.tela} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View style={[estilos.painelMarca, { paddingTop: insets.top + 48 }]}>
        <LogoNexora tamanho={44} />
        <Text style={estilos.wordmark}>Nexora</Text>
        <Text style={estilos.tagline}>
          Acompanhe entradas, saídas e metas do seu mês, com clareza no dia a dia.
        </Text>
      </View>

      <View style={estilos.formulario}>
        <Text style={estilos.eyebrow}>Acesso seguro</Text>
        <Text style={estilos.titulo}>Bem-vindo(a)</Text>
        <Text style={estilos.subtitulo}>Entre com suas credenciais para continuar.</Text>

        <Text style={estilos.rotulo}>E-mail</Text>
        <TextInput
          style={estilos.campo}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />

        <Text style={estilos.rotulo}>Senha</Text>
        <TextInput style={estilos.campo} value={senha} onChangeText={setSenha} secureTextEntry />

        <Text style={estilos.esqueci}>Esqueci minha senha</Text>

        <Pressable style={estilos.botaoEntrar} onPress={aoEntrar}>
          <Text style={estilos.botaoEntrarTexto}>Entrar</Text>
        </Pressable>

        <Text style={estilos.privacidade}>Política de Privacidade</Text>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.superficie,
  },
  painelMarca: {
    backgroundColor: cores.escuro,
    paddingHorizontal: 24,
    paddingBottom: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  wordmark: {
    fontFamily: fontes.titulo,
    fontSize: 22,
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13,
    lineHeight: 20,
    color: cores.brancoSuave,
    maxWidth: 260,
  },
  formulario: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: fontes.titulo,
    color: cores.acento,
    marginBottom: 10,
  },
  titulo: {
    fontFamily: fontes.titulo,
    fontSize: 24,
    color: cores.texto,
    marginBottom: 6,
  },
  subtitulo: {
    fontSize: 13,
    color: cores.neutro600,
    marginBottom: 22,
  },
  rotulo: {
    fontSize: 13,
    fontWeight: '600',
    color: cores.texto,
    marginBottom: 6,
  },
  campo: {
    borderWidth: 1,
    borderColor: cores.neutro300,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: cores.texto,
    backgroundColor: cores.superficie,
    marginBottom: 14,
  },
  esqueci: {
    fontSize: 12,
    fontWeight: '600',
    color: cores.acento,
    textAlign: 'right',
    marginBottom: 20,
  },
  botaoEntrar: {
    backgroundColor: cores.escuro,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  botaoEntrarTexto: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  privacidade: {
    fontSize: 11,
    color: cores.neutro500,
    textAlign: 'center',
    marginTop: 16,
  },
});
