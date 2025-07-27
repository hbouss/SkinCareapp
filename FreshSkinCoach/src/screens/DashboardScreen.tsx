// src/screens/DashboardScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
} from "react-native";
import { api } from "../api/client";
import { BarChart } from "react-native-chart-kit";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../context/AuthContext";
import { translateLabel } from "../i18n/labels"; // ← on importe la fonction
import { BACKEND_URL } from "../config";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type DashboardRouteProp = RouteProp<RootStackParamList, "Dashboard">;
type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, "Dashboard">;

type Props = {
  route: DashboardRouteProp;
  navigation: DashboardNavigationProp;
};

export default function DashboardScreen({ route, navigation }: Props) {
  const { session } = route.params;
  const { image_url, annotated_image_url, scores, timestamp, annotations } = session;
  const { signOut } = useAuth();

  const [interpretation, setInterpretation] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [loadingInterpretation, setLoadingInterpretation] = useState<boolean>(true);

  // 1) On construit et trie les entrées
  const entries = Object.entries(scores)
    .map(([label, v]) => ({ label, value: v * 100 }))
    .sort((a, b) => b.value - a.value);

  // 2) On sépare labels (traduit + wrap) et data
  const BAR_ITEM_WIDTH = 60;
  const labelsRaw = entries.map(e => translateLabel(e.label));
  const labels = labelsRaw.map(label => label.split(" ").join("\n"));
  const data = entries.map(e => Math.round(e.value));

  const chartWidth = labels.length * BAR_ITEM_WIDTH + 40;

  useEffect(() => {
    (async () => {
      setLoadingInterpretation(true);
      try {
        const res = await api.post("/interpret/", { scores });
        LayoutAnimation.easeInEaseOut();
        setInterpretation(res.data.interpretation);
        setSuggestions(res.data.suggestions);
      } catch (err) {
        console.warn("Erreur interprétation :", err);
      } finally {
        setLoadingInterpretation(false);  // ← éteint le loader
      }
    })();
  }, [scores]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* HEADER IMAGE */}
      <View style={styles.header}>
        <Image
          source={{ uri: `${BACKEND_URL}${annotated_image_url}` }}
          style={styles.headerImage}
        />
        <View style={styles.headerOverlay} />
        <Text style={styles.headerDate}>
          Analyse du {new Date(timestamp).toLocaleDateString()}{"\n"}
          {new Date(timestamp).toLocaleTimeString()}
        </Text>
        <TouchableOpacity
          style={styles.zoomBtn}
          hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
          onPress={() =>
            navigation.navigate("ImageDetail", { image_url: annotated_image_url, annotations })
          }
        >
          <Ionicons name="search" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* STATISTIQUES EN BARRES */}
      <View style={[styles.card, styles.chartCard]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={{ labels, datasets: [{ data }] }}
            width={chartWidth}
            height={380}
            fromZero
            yAxisLabel=""
            yAxisSuffix="%"
            chartConfig={{
              backgroundGradientFrom: "#FDF5EF",
              backgroundGradientTo: "#FDF5EF",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(232,106,74,${opacity})`,
              labelColor: () => "#333",
              style: { borderRadius: 16 },
              fillShadowGradient: "#E86A4A",
              fillShadowGradientOpacity: 1,
            }}
            style={styles.chart}
            showValuesOnTopOfBars
            withInnerLines={false}
            verticalLabelRotation={0}
          />
        </ScrollView>
      </View>


      {/* INDICATEUR DE CHARGEMENT POUR L’INTERPRÉTATION */}
      {loadingInterpretation ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E86A4A" />
          <Text style={styles.loaderText}>Chargement de l’interprétation…</Text>
        </View>
      ) : (
        <>
          {/* INTERPRÉTATION */}
          {interpretation.length > 0 && (
            <LinearGradient
              colors={["#FFEFEA", "#FFF6F0"]}
              style={[styles.card, styles.interpretationCard]}
            >
              <Text style={styles.subTitle}>Interprétation</Text>
              <Text style={styles.interpretText}>{interpretation}</Text>
            </LinearGradient>
          )}

          {/* RECOMMANDATIONS */}
          {suggestions.length > 0 && (
            <LinearGradient
              colors={["#FDF5EF", "#FFF6F0"]}
              style={[styles.card, styles.recoCard]}
            >
              <Text style={styles.subTitle}>Nos recommandations</Text>
              <View style={styles.recoList}>
                {suggestions.map((s, i) => {
                  const [title, ...rest] = s.split(":");
                  const detail = rest.join(":").trim();
                  return (
                    <Text key={i} style={styles.recoRow}>
                      <Text style={styles.recoTitle}>{title.trim()}:</Text>
                      <Text style={styles.recoDetail}> {detail}</Text>
                    </Text>
                  );
                })}
              </View>
            </LinearGradient>
          )}
          {/* Bouton stylisé 'Voir les sources*' aligné à droite */}
          <TouchableOpacity
            onPress={() => navigation.navigate("References")}
            style={styles.sourcesButton}
          >
            <Text style={styles.sourcesText}>Voir les sources*</Text>
          </TouchableOpacity>

          {/* Disclaimer */}
          <Text style={styles.disclaimerText}>
            * Informations et recommandations basées sur des études et guidelines reconnues. Pour tout avis médical, consultez un dermatologue.
          </Text>
        </>
      )}

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={[styles.ctaButton, styles.bookButton]}
          onPress={() =>
            Linking.openURL("https://www.planity.com/fr-BE/s-beauty-7000-mons")
          }
        >
          <Text style={styles.ctaText}>Prendre RDV</Text>
        </TouchableOpacity>
      </View>

      {/* ACTIONS */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate("Camera")}
        >
          <Text style={styles.buttonText}>Nouvelle photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate("History")}
        >
          <Text style={styles.buttonText}>Historique</Text>
        </TouchableOpacity>
      </View>

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#FFF6F0", padding: 20, alignItems: "center" },
  header: {
    width: "100%", height: 200, marginBottom: 20, position: "relative",
    borderRadius: 20, overflow: "hidden",
  },
  headerImage: { width: "100%", height: "100%" },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.2)" },
  headerDate: { position: "absolute", bottom: 12, left: 16, color: "#FFF", fontSize: 16, fontWeight: "600" },
  zoomBtn: { position: "absolute", bottom: 12, right: 12, backgroundColor: "rgba(0,0,0,0.5)", padding: 12, borderRadius: 24 },

  card: {
    width: "100%", borderRadius: 20, padding: 15, marginBottom: 20,
    shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10, backgroundColor: "#FFF",
  },
  chartCard: { backgroundColor: "#FDF5EF", paddingVertical: 0 },
  chart: { borderRadius: 16 },

  interpretationCard: {},
  recoCard: {},

  subTitle: { fontSize: 18, fontWeight: "600", color: "#E86A4A", marginBottom: 8 },
  interpretText: { fontSize: 16, color: "#333", fontStyle: "italic", lineHeight: 24, marginTop: 6 },

  recoList: { width: "100%", marginTop: 10 },
  recoRow: { fontSize: 14, marginBottom: 8 },
  recoTitle: { fontSize: 14, fontWeight: "700", color: "#E86A4A" },
  recoDetail: { fontSize: 14, color: "#333", flexShrink: 1 },

  // Nouveau style pour le bouton Sources
  sourcesButton: { alignSelf: "flex-end", marginVertical: 10, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#0066CC", borderRadius: 12 },
  sourcesText: { color: "#0066CC", fontSize: 14, fontWeight: "500" },

  // Style pour le disclaimer
  disclaimerText: { fontSize: 12, color: "#555", fontStyle: "italic", textAlign: "center", marginBottom: 20 },


  ctaContainer: { width: "100%", marginBottom: 20 },
  ctaButton: {
    paddingVertical: 18, borderRadius: 25, alignItems: "center",
    shadowColor: "#FF6B6B", shadowOpacity: 0.3, shadowOffset: { width: 0, height: 3 }, shadowRadius: 10,
  },
  bookButton: { backgroundColor: "#FF6B6B" },
  ctaText: { color: "#FFF", fontSize: 18, fontWeight: "700" },

  actions: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 20 },
  button: {
    flex: 1, paddingVertical: 15, borderRadius: 20, alignItems: "center", marginHorizontal: 5,
    shadowColor: "#E86A4A", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8,
  },
  primaryButton: { backgroundColor: "#E86A4A" },
  secondaryButton: { backgroundColor: "#FFD1C1" },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "600", textAlign: "center" },

  logoutButton: { marginTop: 10, paddingVertical: 12, paddingHorizontal: 40, borderRadius: 20, backgroundColor: "#FDECEF" },
  logoutText: { color: "#E86A4A", fontSize: 14, fontWeight: "600" },

  loaderContainer: {
    width: "100%",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  loaderText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
});