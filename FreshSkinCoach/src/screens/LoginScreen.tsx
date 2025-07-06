// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/AppNavigator";

// Définition du type de navigation pour Login
type AuthNavProp = NativeStackNavigationProp<RootStackParamList, "Login">;

export default function LoginScreen() {
  const { signIn } = useAuth();
  const navigation = useNavigation<AuthNavProp>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async () => {
    try {
      await signIn(email.trim(), password);
    } catch {
      Alert.alert("Erreur", "Email ou mot de passe invalide");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Image source={require("../../assets/sb.png")} style={styles.logo} />
      <Text style={styles.title}>Bienvenue chez SkinCoach</Text>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Email"
          placeholderTextColor="#AAA"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Mot de passe"
          placeholderTextColor="#AAA"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={onSubmit}>
        <Text style={styles.buttonText}>Se connecter</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
        <Text style={styles.switchText}>
          Pas de compte ? <Text style={styles.link}>Inscrivez-vous</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF6F0",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    color: "#E86A4A",
    marginBottom: 30,
    fontWeight: "600",
  },
  inputContainer: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
  },
  input: {
    height: 50,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    marginBottom: 15,
    color: "#333",
  },
  button: {
    width: "100%",
    backgroundColor: "#E86A4A",
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#E86A4A",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  switchText: {
    color: "#666",
    fontSize: 14,
  },
  link: {
    color: "#E86A4A",
    fontWeight: "600",
  },
});
