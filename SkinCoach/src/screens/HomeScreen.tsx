// src/screens/HomeScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, "Home">;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { user, signOut } = useAuth();
  const now = new Date();
  const expiryDate = user?.subscription_expiry ? new Date(user.subscription_expiry) : null;
  const isSubscribed = expiryDate !== null && expiryDate > now;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.welcome}>Bonjour, {user?.email} !</Text>

        {/* Fonctionnalités gratuites */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("Camera")}
        >
          <Text style={styles.cardTitle}>Nouvelle analyse</Text>
          <Text style={styles.cardDesc}>
            Prenez une photo pour analyser votre peau
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("History")}
        >
          <Text style={styles.cardTitle}>Mes analyses</Text>
          <Text style={styles.cardDesc}>
            Consultez votre historique d’analyses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("Stats")}
        >
          <Text style={styles.cardTitle}>Statistiques</Text>
          <Text style={styles.cardDesc}>
            Visualisez l’évolution de votre peau
          </Text>
        </TouchableOpacity>

        {/* Fonctionnalité premium */}
        {isSubscribed ? (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("Camera")}
          >
            <Text style={styles.cardTitle}>Analyse illimitée</Text>
            <Text style={styles.cardDesc}>
              Profitez d'analyses illimitées
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("Subscription")}
          >
            <Text style={styles.cardTitle}>Devenir Premium</Text>
            <Text style={styles.cardDesc}>
              Débloquez des analyses illimitées
            </Text>
          </TouchableOpacity>
        )}

        {/* Fonctionnalité admin */}
        {user?.is_admin && (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("AllHistory")}
          >
            <Text style={styles.cardTitle}>Historique global</Text>
            <Text style={styles.cardDesc}>
              Accédez à toutes les sessions des utilisateurs
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logout} onPress={signOut}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_WIDTH = Dimensions.get("window").width - 40;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF6F0" },
  container: {
    padding: 20,
    alignItems: "center",
  },
  welcome: {
    fontSize: 22,
    fontWeight: "600",
    color: "#E86A4A",
    marginBottom: 20,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: "#666",
  },
  logout: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 20,
    backgroundColor: "#FDECEF",
  },
  logoutText: {
    color: "#E86A4A",
    fontSize: 14,
    fontWeight: "600",
  },
});
