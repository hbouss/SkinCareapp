// src/screens/CameraScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Button,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../context/AuthContext";

type CameraNavigationProp = NativeStackNavigationProp<RootStackParamList, "Camera">;

const WINDOW_WIDTH = Dimensions.get("window").width;
const IMAGE_SIZE = WINDOW_WIDTH * 0.8;
const SCAN_BAR_WIDTH = IMAGE_SIZE;
const SCAN_DURATION = 2000;

export default function CameraScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scanAnim = useRef(new Animated.Value(-SCAN_BAR_WIDTH)).current;
  const navigation = useNavigation<CameraNavigationProp>();
  const { analyzeSkin } = useAuth();

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission refusée", "Nous avons besoin de la caméra.");
      }
    })();
  }, []);

  const startScanAnimation = () => {
    scanAnim.setValue(-SCAN_BAR_WIDTH);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: SCAN_BAR_WIDTH,
          duration: SCAN_DURATION,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: -SCAN_BAR_WIDTH,
          duration: SCAN_DURATION,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleImage = async (
    picker: (opts: ImagePicker.ImagePickerOptions) => Promise<ImagePicker.ImagePickerResult>
  ) => {
    try {
      const result = await picker({
        quality: 0.5,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (result.canceled) return;

      const uri = result.assets[0].uri;
      setImageUri(uri);
      setLoading(true);

      // animation fictive
      startScanAnimation();
      await new Promise((r) => setTimeout(r, SCAN_DURATION));

      // form-data
      const form = new FormData();
      form.append("file", { uri, name: "photo.jpg", type: "image/jpeg" } as any);

      // **ici on appelle notre helper qui gère le quota**
      const session = await analyzeSkin(form);

      setLoading(false);
      navigation.navigate("Dashboard", { session });
    } catch (err: any) {
      setLoading(false);

      // si c'est notre erreur de quota
      if (
        err.message?.includes("Limite gratuite atteinte") ||
        (err.response?.status === 403)
      ) {
        Alert.alert(
          "Quota dépassé",
          "Vous avez fait 3 analyses gratuites. Passez à la version Premium ?",
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Abonnement",
              onPress: () => navigation.navigate("Subscription"),
            },
          ]
        );
      } else {
        Alert.alert("Erreur", "Impossible d'analyser l'image");
      }
    }
  };

  return (
    <View style={styles.container}>
      {imageUri && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          {loading && (
            <Animated.View
              style={[
                { transform: [{ translateY: scanAnim }] },
                styles.scanBarContainer,
              ]}
            >
              <LinearGradient
                colors={["transparent", "rgba(0,255,0,0.4)", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.scanBar}
              />
            </Animated.View>
          )}
        </View>
      )}

      {loading && !imageUri && <ActivityIndicator size="large" color="#E86A4A" />}

      {!loading && (
        <>
          <View style={styles.buttonWrapper}>
            <Button
              title="📷 Prendre photo"
              onPress={() => handleImage(ImagePicker.launchCameraAsync)}
              color="#E86A4A"
            />
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              title="🖼️ Choisir dans la galerie"
              onPress={() => handleImage(ImagePicker.launchImageLibraryAsync)}
              color="#E86A4A"
            />
          </View>
        </>
      )}

      {!imageUri && !loading && (
        <Text style={styles.hint}>Sélectionnez ou prenez une photo</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF6F0", alignItems: "center", justifyContent: "center", padding: 20 },
  previewContainer: { width: IMAGE_SIZE, height: IMAGE_SIZE, marginBottom: 20, borderRadius: 15, overflow: "hidden", backgroundColor: "#000" },
  preview: { width: IMAGE_SIZE, height: IMAGE_SIZE },
  scanBarContainer: { position: "absolute", left: 0, right: 0, height: 20, top: 0, justifyContent: "center", alignItems: "center" },
  scanBar: { width: SCAN_BAR_WIDTH, height: 4, borderRadius: 2 },
  buttonWrapper: { width: "100%", marginVertical: 8 },
  hint: { marginTop: 20, color: "#666", fontSize: 14 },
});