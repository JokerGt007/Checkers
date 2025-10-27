import { useRouter } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../services/firebase";
import UsernameModal from "./components/UsernameModal";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  // Login com email e senha
  const handleEmailLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha todos os campos!");
      return;
    }

    setLoading(true);
    try {
      let userCredential;
      
      if (isSignUp) {
        // Criar nova conta
        userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        
        // Mostrar modal para escolher nome de usuário
        setPendingUser(userCredential.user);
        setShowUsernameModal(true);
        
      } else {
        // Fazer login
        userCredential = await signInWithEmailAndPassword(auth, email, senha);
        Alert.alert("✅ Sucesso", "Login realizado com sucesso!");
        router.push('/');
      }
      
    } catch (error) {
      console.error("Erro de autenticação:", error);
      
      let errorMessage = "Erro desconhecido";
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "Usuário não encontrado";
          break;
        case 'auth/wrong-password':
          errorMessage = "Senha incorreta";
          break;
        case 'auth/email-already-in-use':
          errorMessage = "Este email já está em uso";
          break;
        case 'auth/weak-password':
          errorMessage = "Senha muito fraca (mínimo 6 caracteres)";
          break;
        case 'auth/invalid-email':
          errorMessage = "Email inválido";
          break;
        default:
          errorMessage = error.message;
      }
      
      Alert.alert("Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Confirmar nome de usuário
  const handleUsernameConfirm = async (username) => {
    if (!pendingUser) return;

    setLoading(true);
    try {
      // Criar documento do usuário no Firestore
      await setDoc(doc(db, 'users', pendingUser.uid), {
        email: pendingUser.email,
        username: username,
        createdAt: new Date(),
        selectedSkin: 'skin1',
        selectedSkinName: 'Coringa'
      });
      
      setShowUsernameModal(false);
      setPendingUser(null);
      
      Alert.alert(
        "🎉 Conta Criada!", 
        `Bem-vindo, ${username}! Sua conta foi criada com sucesso.`,
        [{ text: "OK", onPress: () => router.push('/') }]
      );
      
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      Alert.alert("Erro", "Falha ao salvar dados do usuário: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cancelar criação de conta
  const handleUsernameCancel = async () => {
    if (pendingUser) {
      try {
        // Deletar conta criada se cancelar
        await pendingUser.delete();
      } catch (error) {
        console.error("Erro ao deletar conta:", error);
      }
    }
    
    setShowUsernameModal(false);
    setPendingUser(null);
    Alert.alert("Cancelado", "Criação de conta cancelada.");
  };

  // Login com Google (web)
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Verificar se é primeiro login
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        // Primeiro login - usar nome do Google como username
        const googleName = result.user.displayName || result.user.email?.split('@')[0];
        
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          username: googleName,
          photoURL: result.user.photoURL,
          createdAt: new Date(),
          selectedSkin: 'skin1',
          selectedSkinName: 'Coringa'
        });
        
        Alert.alert(
          "🎉 Bem-vindo!", 
          `Conta criada com sucesso! Bem-vindo, ${googleName}!`,
          [{ text: "OK", onPress: () => router.push('/') }]
        );
      } else {
        Alert.alert("✅ Sucesso", "Login com Google realizado!");
        router.push('/');
      }
      
    } catch (error) {
      console.error("Erro Google Auth:", error);
      Alert.alert("Erro", "Falha no login com Google: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <Text style={styles.title}>DAMIUM</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Digite seu email"
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

        <TouchableOpacity 
          style={[styles.loginBtn, loading && styles.disabledBtn]} 
          onPress={handleEmailLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.loginBtnText}>
              {isSignUp ? 'CRIAR CONTA' : 'ENTRAR'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <Text style={styles.toggleText}>
            {isSignUp ? 'Já tem conta? Fazer login' : 'Não tem conta? Criar conta'}
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerSide} />
          <Text style={styles.dividerText}>OU</Text>
          <View style={styles.dividerSide} />
        </View>

        <TouchableOpacity 
          style={[styles.googleBtn, loading && styles.disabledBtn]} 
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <Text style={styles.googleBtnText}>
            {loading ? 'Carregando...' : 'Entrar com Google'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => router.push('/')}>
          <Text style={styles.backLinkText}>← Voltar ao menu</Text>
        </TouchableOpacity>
      </View>

      {/* Modal para escolher nome de usuário */}
      <UsernameModal
        visible={showUsernameModal}
        onConfirm={handleUsernameConfirm}
        onCancel={handleUsernameCancel}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
  },
  container: {
    backgroundColor: "white",
    paddingVertical: 40,
    paddingHorizontal: 30,
    borderRadius: 15,
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
  disabledBtn: {
    backgroundColor: "#666",
    borderColor: "#666",
  },
  loginBtnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  toggleButton: {
    alignItems: "center",
    marginBottom: 10,
  },
  toggleText: {
    color: "#007AFF",
    fontSize: 14,
    textDecorationLine: "underline",
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

