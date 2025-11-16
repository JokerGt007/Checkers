import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
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

// Componente separado para gerenciar loading das imagens
const SkinImage = ({ imageUrl, skinId }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <View style={styles.imageContainer}>
      <Image 
        source={{ uri: imageUrl }}
        style={styles.skinImage}
        onLoadStart={() => {
          setImageLoading(true);
          setImageError(false);
        }}
        onLoad={() => {
          console.log(`✅ Imagem da skin ${skinId} carregada`);
          setImageLoading(false);
        }}
        onError={(error) => {
          console.warn(`⚠️ Erro ao carregar imagem da skin ${skinId}:`, error);
          setImageLoading(false);
          setImageError(true);
        }}
      />
      
      {/* Mostrar spinner APENAS enquanto carrega */}
      {imageLoading && (
        <View style={styles.imageLoadingOverlay}>
          <ActivityIndicator size="small" color="#4CAF50" />
        </View>
      )}
      
      {/* Mostrar ícone de erro se falhar */}
      {imageError && (
        <View style={styles.imageErrorOverlay}>
          <Text style={styles.errorIcon}>❌</Text>
        </View>
      )}
    </View>
  );
};

export default function SkinsMenu() {
  const [selectedSkin, setSelectedSkin] = useState(null);
  const [skins, setSkins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
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
            const userData = userDoc.data();
            setUserProfile(userData);
            
            // Definir a skin atualmente selecionada do usuário
            if (userData.selectedSkin) {
              // Encontrar a skin correspondente na lista quando ela for carregada
              loadSkins().then(() => {
                setSkins(prevSkins => {
                  const userSkin = prevSkins.find(skin => skin.id === userData.selectedSkin);
                  if (userSkin) {
                    setSelectedSkin(userSkin);
                  }
                  return prevSkins;
                });
              });
            }
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
      
      console.log("🔄 Carregando skins do Firebase...");
      
      // Criar query ordenada para buscar as skins em ordem (skin1, skin2, etc.)
      const skinsCollection = collection(db, 'skins');
      const skinsQuery = query(skinsCollection, orderBy('__name__')); // Ordena pelo ID do documento
      const skinsSnapshot = await getDocs(skinsQuery);
      
      if (skinsSnapshot.empty) {
        setError("Collection 'skins' está vazia ou não existe");
        console.log("❌ Collection 'skins' vazia");
        return;
      }
      
      const skinsList = [];
      
      skinsSnapshot.forEach((doc) => {
        const skinData = doc.data();
        console.log(`📦 Skin encontrada: ${doc.id}`, skinData);
        
        // Validar se tem os campos necessários
        if (!skinData.nome || !skinData.url) {
          console.warn(`⚠️ Skin ${doc.id} incompleta:`, skinData);
        }
        
        skinsList.push({
          id: doc.id,
          nome: skinData.nome || `Skin ${doc.id}`,
          url: skinData.url || "",
          description: skinData.description || "",
          // Fallback para uma imagem padrão se a URL estiver vazia
          imageUrl: skinData.url || "https://via.placeholder.com/150x150?text=No+Image"
        });
      });
      
      console.log(`✅ ${skinsList.length} skins carregadas:`, skinsList);
      setSkins(skinsList);
      
      // Se não há skin selecionada ainda, selecionar a primeira
      if (skinsList.length > 0 && !selectedSkin) {
        setSelectedSkin(skinsList[0]);
      }
      
    } catch (error) {
      console.error("❌ Erro ao carregar skins:", error);
      setError(`${error.code || 'unknown'}: ${error.message}`);
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
    console.log(`💾 Salvando skin: ${selectedSkin.nome} (${selectedSkin.id})`);

    try {
      if (user) {
        // Usuário logado - salvar no Firestore
        await updateDoc(doc(db, 'users', user.uid), {
          selectedSkin: selectedSkin.id,
          selectedSkinName: selectedSkin.nome,
          selectedSkinUrl: selectedSkin.url,
          lastUpdated: new Date()
        });
        
        console.log("✅ Skin salva no perfil do usuário");
        
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
      console.error("❌ Erro ao salvar skin:", error);
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
      <Text style={styles.title}>🎨 Escolha sua Skin</Text>
      
      {/* Status do usuário */}
      <View style={styles.userStatus}>
        {user ? (
          <Text style={styles.loggedInText}>
            🟢 Logado: {userProfile?.username || user.displayName || user.email?.split('@')[0]}
          </Text>
        ) : (
          <Text style={styles.loggedOutText}>
            🔴 Não logado - Alterações não serão salvas
          </Text>
        )}
        
        {/* Mostrar skin atual do usuário */}
        {userProfile?.selectedSkinName && (
          <Text style={styles.currentSkinText}>
            🎯 Atual: {userProfile.selectedSkinName}
          </Text>
        )}
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>❌ Erro de Conexão</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSkins}>
            <Text style={styles.retryText}>🔄 Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {skins.length === 0 && !error ? (
        <View style={styles.noSkinsContainer}>
          <Text style={styles.noSkinsText}>📭 Nenhuma skin encontrada</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSkins}>
            <Text style={styles.retryText}>🔄 Recarregar</Text>
          </TouchableOpacity>
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
              onPress={() => {
                setSelectedSkin(skin);
                console.log(`🎯 Skin selecionada: ${skin.nome}`);
              }}
            >
              {/* MUDANÇA AQUI: Usar o componente SkinImage */}
              <SkinImage imageUrl={skin.imageUrl} skinId={skin.id} />
              
              <View style={styles.skinInfo}>
                <Text style={[
                  styles.skinName,
                  selectedSkin?.id === skin.id && styles.selectedSkinName
                ]}>
                  {skin.nome}
                </Text>
                
                {/* Mostrar ID da skin para debug */}
                <Text style={styles.skinId}>ID: {skin.id}</Text>
                
                {/* Mostrar descrição se disponível */}
                {skin.description && (
                  <Text style={styles.skinDescription}>
                    {skin.description}
                  </Text>
                )}
              </View>
              
              {selectedSkin?.id === skin.id && (
                <Text style={styles.selectedIndicator}>✅</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.buttonText}>← Voltar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.confirmButton, 
            (saving || !selectedSkin) && styles.disabledBtn
          ]} 
          onPress={handleConfirm}
          disabled={saving || !selectedSkin}
        >
          {saving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {user ? '💾 Salvar' : '✅ Selecionar'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Informações de debug */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            🐛 Debug: {skins.length} skins | Selecionada: {selectedSkin?.id || 'nenhuma'}
          </Text>
        </View>
      )}
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
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  loggedInText: {
    color: "#4CAF50",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 5,
  },
  loggedOutText: {
    color: "#FFA726",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "bold",
  },
  currentSkinText: {
    color: "#2196F3",
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
  errorContainer: {
    backgroundColor: "#ff4444",
    padding: 15,
    borderRadius: 10,
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
    backgroundColor: "#ffffff30",
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
  },
  retryText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 14,
  },
  noSkinsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noSkinsText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
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
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedSkinItem: {
    borderColor: "#4CAF50",
    backgroundColor: "#1a4a1a",
  },
  imageContainer: {
    position: "relative",
    marginRight: 15,
  },
  skinImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: "#333",
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(51, 51, 51, 0.8)",
    borderRadius: 10,
  },
  imageErrorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 68, 68, 0.3)",
    borderRadius: 10,
  },
  errorIcon: {
    fontSize: 20,
  },
  skinInfo: {
    flex: 1,
  },
  skinName: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 4,
  },
  selectedSkinName: {
    color: "#4CAF50",
  },
  skinId: {
    fontSize: 12,
    color: "#888",
    marginBottom: 2,
  },
  skinDescription: {
    fontSize: 14,
    color: "#ccc",
    fontStyle: "italic",
  },
  selectedIndicator: {
    fontSize: 24,
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
    paddingHorizontal: 25,
    borderRadius: 25,
    flex: 0.45,
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    flex: 0.45,
  },
  disabledBtn: {
    backgroundColor: "#666",
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  debugInfo: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  debugText: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
  },
});