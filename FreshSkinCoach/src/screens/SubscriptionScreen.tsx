// src/screens/SubscriptionScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Linking
} from "react-native";
import * as InAppPurchases from "expo-in-app-purchases";
import { useAuth } from "../context/AuthContext";
import { useIAP } from "../hooks/useIAP";

const PROD_ID = "com.skincoach.premium_monthly";

// URL de votre politique & EULA
const PRIVACY_URL = "https://hbouss.github.io/freshskincoach/privacy-policy.html";
const EULA_URL    = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

export default function SubscriptionScreen() {
  const { subscribe } = useAuth();
  const {
    products,
    loadingProducts,
    error,
    buy,
    restorePurchases,
  } = useIAP([PROD_ID]);
  const [loading, setLoading] = useState(false);

  if (loadingProducts) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#E86A4A" />
        <Text style={styles.loadingText}>Chargement de l’offre…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noOffer}>Aucune offre disponible pour le moment.</Text>
      </View>
    );
  }

  const prod = products[0];

  const onSubscribe = async () => {
    setLoading(true);
    try {
      await buy(PROD_ID);
      const history = await InAppPurchases.getPurchaseHistoryAsync();
      const p = history.results?.find((x) => x.productId === PROD_ID);
      if (!p) throw new Error("Achat non retrouvé");
      await subscribe(
        p.transactionReceipt!,
        p.productId.startsWith("com.android") ? "google" : "apple"
      );
      Alert.alert("🎉", "Vous êtes maintenant Premium !");
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Échec de la souscription");
    } finally {
      setLoading(false);
    }
  };

  const onRestore = async () => {
    setLoading(true);
    try {
      const receipts = await restorePurchases();
      if (receipts.length === 0) {
        Alert.alert("ℹ️", "Aucun achat à restaurer.");
      } else {
        for (const p of receipts) {
          await subscribe(
            p.transactionReceipt!,
            p.productId.startsWith("com.android") ? "google" : "apple"
          );
        }
        Alert.alert("🔄", "Restauration réussie !");
      }
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Échec de la restauration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Passez Premium</Text>
      <View style={styles.card}>
        {/* Optionnel : arrière-plan illustratif */}
        <ImageBackground
          source={require("../../assets/sb.png")}
          style={styles.bgImage}
          imageStyle={{ borderRadius: 16 }}
        >
          <Text style={styles.productTitle}>{prod.title}</Text>
          <Text style={styles.productDesc}>{prod.description}</Text>
          <Text style={styles.productPrice}>{prod.price}</Text>
        </ImageBackground>

        <TouchableOpacity
          style={[styles.button, styles.subscribeButton]}
          onPress={onSubscribe}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>S’abonner</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.engagementText}>
          Abonnement mensuel, sans engagement
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.restoreButton]}
          onPress={onRestore}
          disabled={loading}
        >
          <Text style={styles.restoreText}>Restaurer mes achats</Text>
        </TouchableOpacity>
        {/* ----> NOUVEAU BLOC DE LIENS <---- */}
        <View style={styles.links}>
          <Text style={styles.linkLabel}>Plus d’informations :</Text>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={styles.linkText}>• Politique de confidentialité</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL(EULA_URL)}>
            <Text style={styles.linkText}>• Conditions d’utilisation*</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF6F0",
    padding: 20,
    justifyContent: "flex-start",
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#E86A4A",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  bgImage: {
    width: "100%",
    height: 150,
    marginBottom: 20,
    justifyContent: "flex-end",
    padding: 12,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFF",
  },
  productDesc: {
    fontSize: 14,
    color: "#FFF",
    marginTop: 4,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
    marginTop: 8,
  },
  button: {
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  subscribeButton: {
    backgroundColor: "#E86A4A",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  engagementText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 6,
  },
  restoreButton: {
    backgroundColor: "#FFF6F0",
    borderWidth: 1,
    borderColor: "#E86A4A",
    marginTop: 16,
  },
  restoreText: {
    color: "#E86A4A",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontSize: 16,
  },
  noOffer: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
  },
  links: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    paddingTop: 16,
  },
  linkLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,
    color: "#0066CC",
    textDecorationLine: "underline",
    marginVertical: 4,
  },
});