import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../services/firebase";

// Mapear as imagens locais baseado no ID do documento
const localSkins = {
  skin1: require("../../assets/parts/SKINS/coringa.png"),
  skin2: require("../../assets/parts/SKINS/fnaf.png"),
  skin3: require("../../assets/parts/SKINS/gundam.png"),
  skin4: require("../../assets/parts/SKINS/jesus.png"),
};

export default function SkinsMenu() {
  const [selectedSkin, setSelectedSkin] = useState(null);
  const [skins, setSkins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Adicionar
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSkins();
    
    // Escutar mudanças de autenticação
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Carregar perfil do usuário
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (error) {
          console.error("Erro ao carregar perfil:", error);
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadSkins = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const skinsCollection = collection(db, 'skins');
      const skinsSnapshot = await getDocs(skinsCollection);
      
      if (skinsSnapshot.empty) {
        setError("Collection 'skins' está vazia");
        return;
      }
      
      const skinsList = [];
      
      skinsSnapshot.forEach((doc) => {
        const skinData = doc.data();
        
        skinsList.push({
          id: doc.id,
          nome: skinData.nome || "Nome não encontrado",
          url: skinData.url || "",
          imageSource: localSkins[doc.id] || localSkins.skin1
        });
      });
      
      setSkins(skinsList);
      
      if (skinsList.length > 0) {
        setSelectedSkin(skinsList[0]);
      }
      
    } catch (error) {
      setError(`${error.code}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedSkin) {
      Alert.alert("Aviso", "Selecione uma skin primeiro!");
      return;
    }

    setSaving(true);

    try {
      if (user) {
        // Usuário logado - salvar no Firestore
        await updateDoc(doc(db, 'users', user.uid), {
          selectedSkin: selectedSkin.id,
          selectedSkinName: selectedSkin.nome,
          selectedSkinUrl: selectedSkin.url,
          lastUpdated: new Date()
        });
        
        Alert.alert(
          "✅ Sucesso!", 
          `Skin "${selectedSkin.nome}" foi salva no seu perfil!`,
          [{ text: "OK", onPress: () => router.push('/') }]
        );
      } else {
        // Usuário não logado - apenas feedback local
        Alert.alert(
          "⚠️ Skin Selecionada", 
          `Skin "${selectedSkin.nome}" selecionada!\n\nFaça login para salvar permanentemente.`,
          [
            { text: "Fazer Login", onPress: () => router.push('/login') },
            { text: "Continuar", onPress: () => router.push('/') }
          ]
        );
      }
    } catch (error) {
      console.error("Erro ao salvar skin:", error);
      Alert.alert("Erro", "Não foi possível salvar sua escolha: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Carregando skins...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escolha sua Skin</Text>
      
      {/* Status do usuário */}
      <View style={styles.userStatus}>
        {user ? (
          <Text style={styles.loggedInText}>
            🟢 Logado como: {userProfile?.username || user.displayName || user.email?.split('@')[0]}
          </Text>
        ) : (
          <Text style={styles.loggedOutText}>
            🔴 Não logado - Alterações não serão salvas
          </Text>
        )}
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Erro de Conexão</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSkins}>
            <Text style={styles.retryText}>🔄 Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {skins.length === 0 && !error ? (
        <View style={styles.noSkinsContainer}>
          <Text style={styles.noSkinsText}>Nenhuma skin encontrada</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.skinsContainer}>
          {skins.map((skin) => (
            <TouchableOpacity
              key={skin.id}
              style={[
                styles.skinItem,
                selectedSkin?.id === skin.id && styles.selectedSkinItem
              ]}
              onPress={() => setSelectedSkin(skin)}
            >
              <Image 
                source={skin.imageSource} 
                style={styles.skinImage}
              />
              <Text style={[
                styles.skinName,
                selectedSkin?.id === skin.id && styles.selectedSkinName
              ]}>
                {skin.nome}
              </Text>
              {selectedSkin?.id === skin.id && (
                <Text style={styles.selectedIndicator}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.confirmButton, saving && styles.disabledBtn]} 
          onPress={handleConfirm}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {user ? 'Salvar' : 'Selecionar'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 20,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  userStatus: {
    backgroundColor: "#2a2a2a",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  loggedInText: {
    color: "#4CAF50",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "bold",
  },
  loggedOutText: {
    color: "#FFA726",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "bold",
  },
  errorContainer: {
    backgroundColor: "#ff4444",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  errorText: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#ffffff20",
    padding: 10,
    borderRadius: 5,
  },
  retryText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  noSkinsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noSkinsText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
  },
  skinsContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  skinItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedSkinItem: {
    borderColor: "#4CAF50",
    backgroundColor: "#1a4a1a",
  },
  skinImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  skinName: {
    fontSize: 18,
    color: "#fff",
    flex: 1,
  },
  selectedSkinName: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  selectedIndicator: {
    color: "#4CAF50",
    fontSize: 20,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  backButton: {
    backgroundColor: "#666",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    flex: 0.45,
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    flex: 0.45,
  },
  disabledBtn: {
    backgroundColor: "#666",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});