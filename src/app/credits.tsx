import { Audio } from 'expo-av';
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export type CreditItem = { type: "title" | "role" | "name" | "blank"; text?: string };

const { height } = Dimensions.get('window');

export default function Credits() {
  const scrollY = useRef(new Animated.Value(height)).current;
  const [running, setRunning] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const credits: CreditItem[] = [
    { type: "title", text: "CRÉDITOS FINAIS" },
    { type: "blank" },
    { type: "role", text: "Direção de Projeto" },
    { type: "name", text: "Gianlucca F.C. Machado" },
    { type: "blank" },
    { type: "role", text: "Artes visuais" },
    { type: "name", text: "[Gianlucca F.C. Machado]" },
    { type: "name", text: "[Gustavo A. Silva]" },
    { type: "blank" },
    { type: "role", text: "Design" },
    { type: "name", text: "Elias D. Dias" },
    { type: "name", text: "Gianlucca F.C. Machado" },
    { type: "name", text: "Gustavo A. Silva" },
    { type: "name", text: "João P.L. Aparecido" },
    { type: "blank" },
    { type: "role", text: "Desenvolvimento" },
    { type: "name", text: "Elias D. Dias" },
    { type: "name", text: "Gianlucca F.C. Machado" },
    { type: "name", text: "Gustavo A. Silva" },
    { type: "name", text: "João P.L. Aparecido" },
    { type: "blank" },
    { type: "role", text: "Testes" },
    { type: "name", text: "Elias D. Dias" },
    { type: "name", text: "Gianlucca F.C. Machado" },
    { type: "name", text: "Gustavo A. Silva" },
    { type: "name", text: "João P.L. Aparecido" },
    { type: "blank" },
    { type: "role", text: "Agradecimentos Especiais" },
    { type: "name", text: "[Prof° Hudson J.F. Júnior]" },
    { type: "name", text: "[A toda equipe envolvida]" },
    { type: "blank" },
    { type: "role", text: "Ferramentas e Tecnologias" },
    { type: "name", text: "React Native • TypeScript • Firebase • Git • VS Code" },
    { type: "blank" },
    { type: "role", text: "Versão" },
    { type: "name", text: "v1.0 — 14/12/2024" },
    { type: "blank" },
    { type: "title", text: "Obrigado por jogar!" },
    { type: "blank" },
  ];

  // Voltar ao menu
  const goToMenu = async () => {
    console.log("🏠 Voltando ao menu...");
    
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (error) {
        console.warn("Erro ao parar música:", error);
      }
    }
    
    router.push('/');
  };

  // Carregar e tocar música
  useEffect(() => {
    const loadMusic = async () => {
      try {
        console.log("🎵 Carregando música...");
        
        // Configurar áudio
        await Audio.setAudioModeAsync({
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        // Carregar arquivo de música
        const { sound: newSound } = await Audio.Sound.createAsync(
          require('../../assets/videoplayback.mp3'), // SEU ARQUIVO AQUI
          {
            shouldPlay: true,  // Tocar automaticamente
            isLooping: true,   // Loop infinito
            volume: 0.5,       // Volume 50%
          }
        );

        setSound(newSound);
        console.log("✅ Música carregada e tocando!");

      } catch (error) {
        console.error("❌ Erro ao carregar música:", error);
      }
    };

    loadMusic();

    return () => {
      if (sound) {
        sound.unloadAsync().catch(console.warn);
      }
    };
  }, []);

  // Animação dos créditos
  useEffect(() => {
    if (!running) return;

    const totalHeight = credits.length * 60; // 60px por linha
    const duration = (totalHeight + height) * 50; // 50ms por pixel

    console.log("🎬 Iniciando créditos...");

    const animation = Animated.timing(scrollY, {
      toValue: -totalHeight,
      duration: duration,
      useNativeDriver: true,
    });

    animation.start(() => {
      console.log("🎬 Créditos terminaram");
      goToMenu();
    });

    return () => {
      animation.stop();
    };
  }, [running]);

  // Botão voltar do Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      goToMenu();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  // Pausar/Continuar
  const togglePause = async () => {
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      
      if (running) {
        // Pausar
        await sound.pauseAsync();
        setRunning(false);
        console.log("⏸️ Pausado");
      } else {
        // Continuar
        await sound.playAsync();
        setRunning(true);
        console.log("▶️ Continuando");
      }
    } catch (error) {
      console.warn("Erro ao pausar/continuar:", error);
    }
  };

  // Renderizar item
  const renderItem = (item: CreditItem, index: number) => {
    if (item.type === "blank") {
      return <View key={index} style={styles.blank} />;
    }

    let style = styles.nameText;
    // if (item.type === "title") style = styles.titleText;
    // if (item.type === "role") style = styles.roleText;

    return (
      <Text key={index} style={style}>
        {item.text}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      {/* Créditos animados */}
      <Animated.View
        style={[
          styles.creditsContainer,
          { transform: [{ translateY: scrollY }] }
        ]}
      >
        {credits.map((item, index) => renderItem(item, index))}
      </Animated.View>

      {/* Fade superior */}
      <View style={styles.fadeTop} />

      {/* Fade inferior */}
      <View style={styles.fadeBottom} />

      {/* Botões de controle */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.menuButton} onPress={goToMenu}>
          <Text style={styles.buttonText}>🏠 Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
          <Text style={styles.buttonText}>
            {running ? "⏸️ Pausar" : "▶️ Play"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status */}
      <View style={styles.status}>
        <Text style={styles.statusText}>
          🎵 {sound ? "Música carregada" : "Carregando música..."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050509',
    overflow: 'hidden',
  },
  creditsContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  titleText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginVertical: 20,
  },
  roleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e6e6e6',
    textAlign: 'center',
    marginVertical: 15,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#cfcfcf',
    textAlign: 'center',
    marginVertical: 8,
  },
  blank: {
    height: 30,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(5,5,9,0.9)',
    zIndex: 1,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(5,5,9,0.9)',
    zIndex: 1,
  },
  controls: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    zIndex: 2,
    gap: 10,
  },
  menuButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  pauseButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  status: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  statusText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
});
