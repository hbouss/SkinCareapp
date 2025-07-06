// src/screens/HistoryScreen.tsx
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { api } from "../api/client";
import { translateLabel } from "../i18n/labels"; // ← import de la fonction
import { BACKEND_URL } from "../config";

type Annotation = {
  x: number; y: number; width: number; height: number; label: string;
};

type Session = {
  session_id: number;
  image_url: string;
  annotated_image_url: string;
  scores: Record<string, number>;
  timestamp: string;
  annotations: Annotation[];
};

type HistoryNavProp = NativeStackNavigationProp<RootStackParamList, "History">;

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const navigation = useNavigation<HistoryNavProp>();

  useEffect(() => {
    (async () => {
      const res = await api.get<Session[]>("/skin/history");
      setSessions(res.data);
    })();
  }, []);

  const handleDelete = (session_id: number) => {
    Alert.alert(
      "Supprimer cette analyse ?",
      "Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Oui",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/skin/history/${session_id}`);
              setSessions(curr => curr.filter(s => s.session_id !== session_id));
            } catch {
              Alert.alert("Erreur", "La suppression a échoué.");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Session }) => {
    const date = new Date(item.timestamp);
    const keyScores = Object.entries(item.scores)
      .filter(([, v]) => v > 0)
      .map(([label, v]) => ({ label, value: v }));

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() =>
            navigation.navigate("Dashboard", { session: item })
          }
        >
          <Image
            source={{ uri: `${BACKEND_URL}${item.image_url}` }}
            style={styles.thumbnail}
          />
          <View>
            <Text style={styles.cardDate}>
              {date.toLocaleDateString()} à {date.toLocaleTimeString()}
            </Text>
            <View style={styles.scoresRow}>
              {keyScores.length > 0 ? (
                keyScores.map((s) => (
                  <View key={s.label} style={styles.scoreBox}>
                    <Text style={styles.scoreLabel}>
                      {translateLabel(s.label)}
                    </Text>
                    <Text style={styles.scoreValue}>
                      {(s.value * 100).toFixed(0)}%
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noScores}>Aucun score disponible</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.session_id)}
        >
          <MaterialIcons name="delete-outline" size={24} color="#E86A4A" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={sessions}
        keyExtractor={item => item.session_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucune analyse pour le moment.</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.homeButtonText}>← Retour à l’accueil</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const CARD_WIDTH = Dimensions.get("window").width - 40;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFF6F0",
  },
  list: {
    padding: 20,
  },
  card: {
    width: CARD_WIDTH,
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 20,
    marginBottom: 15,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 12,
  },
  cardDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  scoresRow: {
    flexDirection: "row",
  },
  scoreBox: {
    marginRight: 16,
  },
  scoreLabel: {
    fontSize: 12,
    color: "#999",
  },
  scoreValue: {
    fontSize: 16,
    color: "#E86A4A",
    fontWeight: "600",
  },
  noScores: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  deleteButton: {
    padding: 12,
  },
  empty: {
    marginTop: 50,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  homeButton: {
    margin: 20,
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: "#E86A4A",
    borderRadius: 20,
    shadowColor: "#E86A4A",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
  },
  homeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});