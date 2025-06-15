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
import { api } from "../api/client";

type CameraNavigationProp = NativeStackNavigationProp<RootStackParamList, "Camera">;

// constants
const WINDOW_WIDTH = Dimensions.get("window").width;
const IMAGE_SIZE = WINDOW_WIDTH * 0.8;         // taille du carré de preview
const SCAN_BAR_WIDTH = IMAGE_SIZE;             // barre couvre la largeur de l’image
const SCAN_DURATION = 2000;                    // ms

export default function CameraScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scanAnim = useRef(new Animated.Value(-SCAN_BAR_WIDTH)).current;
  const navigation = useNavigation<CameraNavigationProp>();

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission refusée", "Nous avons besoin de la caméra.");
      }
    })();
  }, []);

    // On boucle une descente puis une remontée
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
    picker: (options: ImagePicker.ImagePickerOptions) => Promise<ImagePicker.ImagePickerResult>
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

      // scan
      startScanAnimation();
      await new Promise((r) => setTimeout(r, SCAN_DURATION));

      // envoi
      const form = new FormData();
      form.append("file", { uri, name: "photo.jpg", type: "image/jpeg" } as any);
      const res = await api.post("/skin/analyze", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setLoading(false);
      navigation.navigate("Dashboard", { session: res.data });
    } catch {
      setLoading(false);
      Alert.alert("Erreur", "Impossible d'analyser l'image");
    }
  };

  return (
    <View style={styles.container}>
      {/* preview + scan */}
      {imageUri && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          {loading && (
           <Animated.View
             style={[
               // on déplace verticalement la barre (y), plus un petit décalage horizontal pour le réalisme
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

      {/* loader */}
      {loading && !imageUri && <ActivityIndicator size="large" color="#E86A4A" />}

      {/* actions */}
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

      {/* invite */}
      {!imageUri && !loading && (
        <Text style={styles.hint}>Sélectionnez ou prenez une photo</Text>
      )}
    </View>
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
  previewContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  preview: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
   // conteneur absolu pour la barre de scan
 scanBarContainer: {
   position: "absolute",
   left: 0,
   right: 0,
   height: 20,          // zone de dégradé
   top: 0,              // on va animer translateY
   justifyContent: "center",
   alignItems: "center",
 },
 // barre dégradée
 scanBar: {
   width: SCAN_BAR_WIDTH,
   height: 4,
   borderRadius: 2,
 },
  buttonWrapper: {
    width: "100%",
    marginVertical: 8,
  },
  hint: {
    marginTop: 20,
    color: "#666",
    fontSize: 14,
  },
});