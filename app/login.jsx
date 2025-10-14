import { useRouter } from 'expo-router';
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');

  function handleLogin() {
    Alert.alert("Login", "Login ainda não implementado!");
  }

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <Text style={styles.title}>DAMIUN</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Usuário</Text>
          <TextInput
            style={styles.input}
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
            placeholder="Digite seu usuário"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            placeholder="Digite sua senha"
          />
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginBtnText}>ENTRAR</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerSide} />
          <Text style={styles.dividerText}>OU</Text>
          <View style={styles.dividerSide} />
        </View>

        <TouchableOpacity style={styles.googleBtn} onPress={() => Alert.alert('Google', 'Login com Google em breve!')}>
          <Text style={styles.googleBtnText}>Entrar com Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => router.push('/')}>
          <Text style={styles.backLinkText}>← Voltar ao menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex:1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
  },
  container: {
    backgroundColor: "white",
    paddingVertical: 40,
    paddingHorizontal: 30,
    borderRadius: 15,
    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
    width: 350,
    maxWidth: "90%",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: 2,
    color: "#222",
    marginBottom: 30,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 4,
    backgroundColor: "#f9f9f9",
  },
  loginBtn: {
    width: "100%",
    padding: 15,
    marginTop: 10,
    backgroundColor: "#000",
    borderWidth: 3,
    borderColor: "#000",
    alignItems: "center",
    borderRadius: 3,
    marginBottom: 10,
  },
  loginBtnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  dividerSide: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 8,
    color: "#666",
  },
  googleBtn: {
    width: "100%",
    padding: 15,
    marginBottom: 8,
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: "#000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 3,
  },
  googleBtnText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  backLink: {
    marginTop: 18,
    alignItems: "center",
  },
  backLinkText: {
    color: "#666",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});

