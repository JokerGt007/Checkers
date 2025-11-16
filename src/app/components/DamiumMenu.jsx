import { router } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../services/firebase';

const menuItems = [
  { label: 'JOGAR', href: '/jogar' },
  { label: 'SKINS', href: '/skins' },
  { label: 'RANKING', href: '/ranking' },
  { label: 'CONFIG.', href: '/configuracoes' },
  { label: 'CRÉDITOS', href: '/creditos' },
];

export default function DamiumMenu() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("🔄 Auth state changed:", currentUser?.email);
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          
          if (userDoc.exists()) {
            console.log("👤 User profile loaded:", userDoc.data());
            setUserProfile(userDoc.data());
          } else {
            console.log("⚠️ No user profile found - creating one...");
            
            const defaultProfile = {
              email: currentUser.email,
              username: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuário',
              createdAt: new Date(),
              selectedSkin: 'skin1',
              selectedSkinName: 'Coringa'
            };
            
            await setDoc(doc(db, 'users', currentUser.uid), defaultProfile);
            console.log("✅ User profile created:", defaultProfile);
            setUserProfile(defaultProfile);
          }
        } catch (error) {
          console.error("❌ Erro ao carregar/criar perfil:", error);
          setUserProfile(null);
        }
      } else {
        console.log("🚪 User logged out");
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUserIconPress = () => {
    console.log("🖱️ Ícone clicado!");
    
    if (user) {
      console.log("✅ Usuário logado - abrindo modal");
      setShowUserModal(true);
    } else {
      console.log("🔐 Usuário não logado - indo para login");
      router.push('/login');
    }
  };

  const handleLogout = async () => {
    try {
      console.log("🚪 Fazendo logout...");
      await signOut(auth);
      
      setUser(null);
      setUserProfile(null);
      setShowUserModal(false);
      
      console.log("✅ Logout concluído");
    } catch (error) {
      console.error("❌ Erro no logout:", error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const userName = userProfile?.username || user?.displayName || user?.email?.split('@')[0] || 'Usuário';

  return (
    <View style={styles.container}>
      {/* Ícone do usuário */}
      <TouchableOpacity 
        style={styles.userIcon}
        onPress={handleUserIconPress}
        activeOpacity={0.7}
      >
        <Text style={styles.userIconText}>
          {user ? '👤' : '🔐'}
        </Text>
        {user && (
          <View style={styles.onlineIndicator} />
        )}
      </TouchableOpacity>

      <Text style={styles.title}>DAMIUM</Text>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => router.push(item.href)}
          >
            <Text style={styles.menuText} numberOfLines={1} adjustsFontSizeToFit>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statusBar}>
        {user ? (
          <Text style={styles.statusLoggedIn} numberOfLines={1}>
            🟢 {userName}
            {userProfile?.selectedSkinName && ` • ${userProfile.selectedSkinName}`}
          </Text>
        ) : (
          <Text style={styles.statusLoggedOut}>
            🔴 Não logado
          </Text>
        )}
      </View>

      {/* Modal do usuário */}
      <Modal
        visible={showUserModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>👤 {userName}</Text>
            
            <View style={styles.userInfo}>
              <Text style={styles.userInfoText}>Email: {user?.email}</Text>
              <Text style={styles.userInfoText}>
                Skin: {userProfile?.selectedSkinName || 'Coringa'}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={() => {
                  setShowUserModal(false);
                  router.push('/perfil'); // MUDANÇA AQUI
                }}
              >
                <Text style={styles.profileButtonText}>👤 Perfil</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutButtonText}>🚪 Logout</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowUserModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  userIcon: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  userIconText: {
    fontSize: 20,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#0a0a0a',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 50,
    letterSpacing: 3,
  },
  menuContainer: {
    width: '100%',
    alignItems: 'center',
  },
  menuItem: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginVertical: 8,
    borderRadius: 25,
    width: '85%',
    borderWidth: 2,
    borderColor: '#333',
    minHeight: 50,
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    flexShrink: 1,
  },
  statusBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1a1a1a',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  statusLoggedIn: {
    color: '#4CAF50',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  statusLoggedOut: {
    color: '#FFA726',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  userInfo: {
    width: '100%',
    marginBottom: 25,
  },
  userInfoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  profileButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 0.48,
  },
  profileButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 0.48,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'bold',
  },
});