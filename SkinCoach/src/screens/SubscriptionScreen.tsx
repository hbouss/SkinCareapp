// src/screens/SubscriptionScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import * as InAppPurchases from "expo-in-app-purchases";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../api/client";
import { useAuth } from "../context/AuthContext";

const PRODUCT_IDS = ["premium_monthly", "premium_yearly"];

type SubscriptionStatus = {
  id: string;
  email: string;
  is_admin: boolean;
  subscription_expiry: string | null;
};

export default function SubscriptionScreen() {
  const { user } = useAuth();
  const [products, setProducts] = useState<InAppPurchases.IAPItemDetails[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [expiry, setExpiry] = useState<string | null>(null);

  useEffect(() => {
    // 1) Récupérer les produits
    InAppPurchases.getProductsAsync(PRODUCT_IDS)
      .then(({ responseCode, results }) => {
        if (responseCode === InAppPurchases.IAPResponseCode.OK) {
          setProducts(results);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingProducts(false));

    // 2) Récupérer l'état d'abonnement depuis le back-end
    (async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        const res = await fetch(`${API_BASE}/subscription/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data: SubscriptionStatus = await res.json();
          setExpiry(data.subscription_expiry);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const handlePurchase = (productId: string) => {
    InAppPurchases.purchaseItemAsync(productId);
  };

  const renderProduct = ({ item }: { item: InAppPurchases.IAPItemDetails }) => (
    <View style={styles.product}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.price}>{item.price}</Text>
      <Button title="S'abonner" onPress={() => handlePurchase(item.productId)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Abonnement Premium</Text>
      {loadingProducts ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.productId}
          renderItem={renderProduct}
          ListEmptyComponent={() => <Text>Aucun abonnement disponible.</Text>}
        />
      )}
      {expiry && (
        <Text style={styles.expiry}>
          Votre abonnement expire le {new Date(expiry).toLocaleDateString()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#FFF6F0" },
  header: { fontSize: 22, fontWeight: "600", color: "#E86A4A", marginBottom: 20 },
  product: { marginBottom: 20, padding: 15, backgroundColor: "#FFF", borderRadius: 10 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 5 },
  description: { fontSize: 14, color: "#666", marginBottom: 8 },
  price: { fontSize: 16, fontWeight: "500", marginBottom: 10 },
  expiry: { marginTop: 20, textAlign: "center", color: "#333" }
});
