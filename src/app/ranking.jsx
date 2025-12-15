import { FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { db } from "../services/firebase";

const RankingScreen = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigation = useNavigation();

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const playersSnap = await getDocs(collection(db, "rankings"));
        const rankingArray = [];

        for (const playerDoc of playersSnap.docs) {
          const matchesRef = collection(db, "rankings", playerDoc.id, "matches");
          const matchesSnap = await getDocs(matchesRef);

          let totalScore = 0;
          let totalMatches = 0;
          let playerName = "";
          let playerLevel = 1;

          matchesSnap.forEach((matchDoc) => {
            const data = matchDoc.data();

            totalScore += Number(data.score || 0);
            totalMatches += 1;
            playerName = data.name;
            playerLevel = data.level;
          });

          if (totalMatches > 0) {
            rankingArray.push({
              id: playerDoc.id,
              name: playerName,
              level: playerLevel,
              score: totalScore,
              matches: totalMatches,
            });
          }
        }

        rankingArray.sort((a, b) => b.score - a.score);

        const ranked = rankingArray.map((item, index) => ({
          ...item,
          rank: index + 1,
        }));

        setRankings(ranked);
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar ranking");
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.rank}>{item.rank}</Text>

      <FontAwesome5
        name={item.rank === 1 ? "trophy" : item.rank === 2 ? "medal" : "star"}
        size={20}
        color={item.rank === 1 ? "gold" : item.rank === 2 ? "silver" : "bronze"}
        style={{ marginRight: 10 }}
      />

      <View style={styles.playerInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.details}>
          Pontos: {item.score} | Partidas: {item.matches} | Nível: {item.level}
        </Text>
      </View>
    </View>
  );

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ color: "#fff" }}>Carregando ranking...</Text>
      </View>
    );

  if (error)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>🏆 Ranking Global</Text>

      <FlatList
        data={rankings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 20,
  },

  backButton: {
    backgroundColor: "#2a2a2a",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#4CAF50",
    alignSelf: "flex-start",
    marginBottom: 20,
  },

  backButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    padding: 15,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#333",
  },

  rank: {
    fontSize: 22,
    color: "#4CAF50",
    fontWeight: "bold",
    width: 40,
    textAlign: "center",
  },

  playerInfo: {
    flex: 1,
    marginLeft: 10,
  },

  name: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },

  details: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 4,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  error: {
    color: "#ff4444",
    fontSize: 16,
  },
});

export default RankingScreen;
