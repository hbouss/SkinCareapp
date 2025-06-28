// src/screens/SubscriptionScreen.tsx
import React, { useState } from "react";
import { View, Text, Button, Alert, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function SubscriptionScreen() {
  const { subscribe } = useAuth();
  const [loading, setLoading] = useState(false);

  const onSubscribe = async () => {
    setLoading(true);
    try {
      // valeur factice pour passer en premium
      await subscribe("DEV_RECEIPT", "apple");
      Alert.alert("✨ Bravo !", "Vous êtes maintenant Premium !");
    } catch (e) {
      Alert.alert("Erreur", "Impossible de souscrire pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Version Premium</Text>
      <Text style={styles.desc}>
        Profitez d'analyses illimitées et d'accès prioritaire !
      </Text>
      <Button
        title={loading ? "Patientez…" : "Passer en Premium (dev)"}
        onPress={onSubscribe}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:"center", padding:20 },
  title: { fontSize:24, fontWeight:"bold", marginBottom:20 },
  desc: { fontSize:16, marginBottom:30 },
});