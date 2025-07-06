import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { api } from "../api/client";

type AuthNavProp = NativeStackNavigationProp<RootStackParamList, "Login">;

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation<AuthNavProp>();

  const onSignUp = async () => {
    try {
      await api.post("/auth/signup", { email, password });
      Alert.alert("Succès", "Compte créé ! Vous pouvez vous connecter.");
      navigation.navigate("Login");
    } catch (err: any) {
      Alert.alert("Erreur", err.response?.data?.detail || "Impossible de s'inscrire");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Créer un compte</Text>
      <TextInput
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Mot de passe"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      <Button title="S'inscrire" onPress={onSignUp} />
      <Text style={styles.switch}>
        Vous avez déjà un compte?{" "}
        <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
          Se connecter
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, textAlign: "center", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  switch: { textAlign: "center", marginTop: 15 },
  link: { color: "blue" },
});