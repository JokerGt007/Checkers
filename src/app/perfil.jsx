import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../services/firebase';

export default function PerfilScreen() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Estados do formulário
  const [username, setUsername] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const profileData = userDoc.data();
            setUserProfile(profileData);
            setUsername(profileData.username || '');
            
            // Usar foto do Google se disponível, senão usar a salva no perfil
            const currentPhotoURL = profileData.photoURL || currentUser.photoURL || '';
            setPhotoURL(currentPhotoURL);
            
            // Se há foto do Google mas não está salva no perfil, salvar automaticamente
            if (currentUser.photoURL && !profileData.photoURL) {
              console.log("📷 Salvando foto do Google automaticamente...");
              await updateDoc(doc(db, 'users', currentUser.uid), {
                photoURL: currentUser.photoURL
              });
              setUserProfile(prev => ({ ...prev, photoURL: currentUser.photoURL }));
            }
          }
        } catch (error) {
          console.error("Erro ao carregar perfil:", error);
          Alert.alert("Erro", "Não foi possível carregar o perfil");
        }
      } else {
        // Usuário não logado - redirecionar
        router.push('/login');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Verificar se há mudanças
  useEffect(() => {
    if (userProfile) {
      const originalUsername = userProfile.username || '';
      const originalPhotoURL = userProfile.photoURL || user?.photoURL || '';
      
      const usernameChanged = username !== originalUsername;
      const photoChanged = photoURL !== originalPhotoURL;
      
      setHasChanges(usernameChanged || photoChanged);
    }
  }, [username, photoURL, userProfile, user]);

  // Validar URL de imagem
  const isValidImageURL = (url) => {
    if (!url) return true; // URL vazia é válida (sem foto)
    
    // Aceitar base64
    if (url.startsWith('data:image/')) return true;
    
    // Verificar se é uma URL válida
    try {
      new URL(url);
    } catch {
      return false;
    }
    
    // Verificar se termina com extensão de imagem
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const lowerURL = url.toLowerCase();
    
    return imageExtensions.some(ext => lowerURL.includes(ext)) || 
           lowerURL.includes('googleusercontent.com') ||
           lowerURL.includes('imgur.com') ||
           lowerURL.includes('cloudinary.com') ||
           lowerURL.includes('amazonaws.com') ||
           lowerURL.includes('postimg.cc') ||
           lowerURL.includes('imgbb.com');
  };

  // Solicitar permissão para galeria
  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Necessária',
        'Precisamos de permissão para acessar sua galeria de fotos.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Configurações', onPress: () => {
            Alert.alert('Configurações', 'Vá em Configurações > Apps > Damium > Permissões e habilite o acesso à galeria.');
          }}
        ]
      );
      return false;
    }
    
    return true;
  };

  // Função para fazer upload para serviço gratuito (imgbb.com)
  const uploadToImgbb = async (base64Image) => {
    try {
      // API Key gratuita do imgbb.com (você pode se cadastrar e usar sua própria)
      const API_KEY = '7d12e24e3e8a9b5c3c4f8e0b1d9e6a2f'; // Substitua por sua API key
      
      const formData = new FormData();
      formData.append('image', base64Image);
      
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        return result.data.url;
      } else {
        throw new Error(result.error?.message || 'Erro no upload');
      }
    } catch (error) {
      console.error('Erro no upload para imgbb:', error);
      throw error;
    }
  };

  // Escolher e fazer upload da foto
  const pickImageFromGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    try {
      setUploadingPhoto(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Foto quadrada
        quality: 0.5, // Reduzir qualidade para upload mais rápido
        base64: true, // Obter base64 da imagem
      });

      if (!result.canceled) {
        console.log("📷 Foto selecionada, fazendo upload...");
        
        try {
          // Opção 1: Converter para base64 e salvar diretamente (mais simples)
          const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
          setPhotoURL(base64);
          
          Alert.alert("✅ Sucesso!", "Foto atualizada! Lembre-se de salvar as alterações.");
          
          // Opção 2: Upload para serviço gratuito (descomente se quiser usar)
          /*
          const uploadedURL = await uploadToImgbb(result.assets[0].base64);
          setPhotoURL(uploadedURL);
          Alert.alert("✅ Sucesso!", "Foto enviada e URL gerada! Lembre-se de salvar as alterações.");
          */
          
        } catch (uploadError) {
          console.error("Erro no upload:", uploadError);
          Alert.alert(
            "Erro no Upload", 
            "Não foi possível enviar a imagem. Tente usar uma URL de imagem ou uma foto menor."
          );
        }
      }
    } catch (error) {
      console.error("Erro ao selecionar imagem:", error);
      Alert.alert("Erro", "Não foi possível selecionar a imagem");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Salvar alterações
  const handleSave = async () => {
    if (!user || !hasChanges) return;

    // Validar username
    if (!username.trim()) {
      Alert.alert("Erro", "Digite um nome de usuário!");
      return;
    }
    
    if (username.trim().length < 3) {
      Alert.alert("Erro", "Nome deve ter pelo menos 3 caracteres!");
      return;
    }
    
    if (username.trim().length > 20) {
      Alert.alert("Erro", "Nome deve ter no máximo 20 caracteres!");
      return;
    }

    // Validar URL da foto
    if (photoURL && !isValidImageURL(photoURL)) {
      Alert.alert(
        "URL Inválida", 
        "Por favor, insira uma URL válida de imagem ou use a galeria para selecionar uma foto."
      );
      return;
    }

    setSaving(true);

    try {
      // Atualizar dados no Firestore
      const updateData = {
        username: username.trim(),
        photoURL: photoURL.trim() || null,
        lastUpdated: new Date()
      };

      await updateDoc(doc(db, 'users', user.uid), updateData);
      
      // Atualizar estado local
      setUserProfile({
        ...userProfile,
        ...updateData
      });
      
      Alert.alert(
        "✅ Sucesso!",
        "Perfil atualizado com sucesso!",
        [{ text: "OK", onPress: () => router.push('/') }]
      );
      
    } catch (error) {
      console.error("❌ Erro ao salvar perfil:", error);
      Alert.alert("Erro", "Não foi possível salvar as alterações: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Cancelar alterações
  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        "Descartar Alterações?",
        "Você tem alterações não salvas. Deseja descartá-las?",
        [
          { text: "Não", style: "cancel" },
          { text: "Sim", onPress: () => router.push('/') }
        ]
      );
    } else {
      router.push('/');
    }
  };

  // Restaurar foto do Google
  const restoreGooglePhoto = () => {
    if (user?.photoURL) {
      setPhotoURL(user.photoURL);
      Alert.alert("✅ Foto restaurada", "Foto do Google foi restaurada!");
    } else {
      Alert.alert("ℹ️ Sem foto do Google", "Não há foto disponível na sua conta do Google.");
    }
  };

  // Remover foto
  const removePhoto = () => {
    Alert.alert(
      "Remover Foto?",
      "Tem certeza que deseja remover sua foto de perfil?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Remover", style: "destructive", onPress: () => setPhotoURL('') }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={styles.errorText}>Você precisa estar logado!</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
          <Text style={styles.loginButtonText}>Fazer Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>👤 Meu Perfil</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Foto de Perfil */}
      <View style={styles.photoSection}>
        <TouchableOpacity 
          style={styles.photoContainer} 
          onPress={pickImageFromGallery}
          disabled={uploadingPhoto}
        >
          {photoURL ? (
            <Image 
              source={{ uri: photoURL }} 
              style={styles.profilePhoto}
              onError={() => {
                Alert.alert("Erro", "Não foi possível carregar a imagem. Verifique a URL.");
                setPhotoURL('');
              }}
            />
          ) : (
            <View style={styles.defaultPhoto}>
              <Text style={styles.defaultPhotoText}>👤</Text>
            </View>
          )}
          
          {/* Overlay de edição */}
          <View style={styles.photoOverlay}>
            {uploadingPhoto ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.photoOverlayText}>📷</Text>
            )}
          </View>
        </TouchableOpacity>
        
        <Text style={styles.photoHint}>
          {uploadingPhoto ? "Processando foto..." : "Toque para escolher foto da galeria"}
        </Text>
        
        {/* Botões da foto */}
        <View style={styles.photoButtons}>
          {user?.photoURL && (
            <TouchableOpacity style={styles.googlePhotoButton} onPress={restoreGooglePhoto}>
              <Text style={styles.googlePhotoButtonText}>📷 Google</Text>
            </TouchableOpacity>
          )}
          
          {photoURL && (
            <TouchableOpacity style={styles.removePhotoButton} onPress={removePhoto}>
              <Text style={styles.removePhotoButtonText}>🗑️ Remover</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Formulário */}
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome de Usuário</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            maxLength={20}
            placeholder="Digite seu nome de usuário"
            placeholderTextColor="#666"
          />
          <Text style={styles.charCount}>
            {username.length}/20 caracteres
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>URL da Foto (opcional)</Text>
          <TextInput
            style={styles.input}
            value={photoURL}
            onChangeText={setPhotoURL}
            placeholder="https://exemplo.com/minha-foto.jpg"
            placeholderTextColor="#666"
            multiline
            numberOfLines={2}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.photoHint}>
            💡 Cole aqui o link de uma imagem da internet ou use a galeria acima
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email (somente leitura)</Text>
          <View style={styles.readOnlyInput}>
            <Text style={styles.readOnlyText}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Método de Login</Text>
          <View style={styles.readOnlyInput}>
            <Text style={styles.readOnlyText}>
              {user.providerData[0]?.providerId === 'google.com' ? '🔗 Google' : '📧 Email/Senha'}
            </Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Skin Atual</Text>
          <View style={styles.readOnlyInput}>
            <Text style={styles.readOnlyText}>
              {userProfile?.selectedSkinName || 'Coringa'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.skinButton}
            onPress={() => router.push('/skins')}
          >
            <Text style={styles.skinButtonText}>🎨 Alterar Skin</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status de Upload */}
      {uploadingPhoto && (
        <View style={styles.uploadStatus}>
          <ActivityIndicator color="#4CAF50" />
          <Text style={styles.uploadText}>Processando foto...</Text>
        </View>
      )}

      {/* Dicas de URLs */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Opções para foto:</Text>
        <Text style={styles.tipText}>• 📷 Galeria: Toque na foto para escolher do celular</Text>
        <Text style={styles.tipText}>• 🌐 URL: Google Fotos, Imgur.com, etc.</Text>
        <Text style={styles.tipText}>• 🔗 Google: Use a foto da sua conta Google</Text>
      </View>

      {/* Botões */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={handleCancel}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.saveButton, 
            (!hasChanges || saving || uploadingPhoto) && styles.disabledButton
          ]} 
          onPress={handleSave}
          disabled={!hasChanges || saving || uploadingPhoto}
        >
          {saving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>
              {hasChanges ? 'Salvar' : 'Nada alterado'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#666',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSpacer: {
    width: 80,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#4CAF50',
  },
  defaultPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a1a',
    borderWidth: 4,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultPhotoText: {
    fontSize: 60,
    opacity: 0.5,
  },
  photoHint: {
    color: '#888',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  googlePhotoButton: {
    backgroundColor: '#4285f4',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  googlePhotoButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  removePhotoButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  removePhotoButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontSize: 16,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#333',
    textAlignVertical: 'top',
  },
  charCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 5,
  },
  readOnlyInput: {
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#222',
  },
  readOnlyText: {
    color: '#888',
    fontSize: 16,
  },
  skinButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  skinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tipsSection: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  tipsTitle: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tipText: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#666',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    flex: 0.45,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    flex: 0.45,
  },
  disabledButton: {
    backgroundColor: '#333',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0a0a0a',
  },
  photoOverlayText: {
    fontSize: 18,
  },
  uploadStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#1a4a1a',
    borderRadius: 10,
  },
  uploadText: {
    color: '#4CAF50',
    marginLeft: 10,
    fontSize: 14,
  },
});