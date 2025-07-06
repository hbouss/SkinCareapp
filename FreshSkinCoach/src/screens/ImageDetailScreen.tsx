// src/screens/ImageDetailScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { translateLabel } from "../i18n/labels"; // ← Import du translateLabel
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BACKEND_URL } from "../config";

type DetailRouteProp = RouteProp<RootStackParamList, "ImageDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ImageDetail">;
type Props = { route: DetailRouteProp };

export default function ImageDetailScreen({ route }: Props) {
  const navigation = useNavigation<NavigationProp>();
  const { image_url, annotations = [] } = route.params;
  const uri = `${BACKEND_URL}${image_url}`;

  const [origW, setOrigW] = useState(1);
  const [origH, setOrigH] = useState(1);
  useEffect(() => {
    Image.getSize(
      uri,
      (w, h) => {
        setOrigW(w);
        setOrigH(h);
      },
      () => console.warn("Impossible de récupérer la taille native")
    );
  }, [uri]);

  const screenW = Dimensions.get("window").width - 20;
  const screenH = (origH / origW) * screenW;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.wrapper, { width: screenW, height: screenH }]}>
        <Image
          source={{ uri }}
          style={{ width: screenW, height: screenH, borderRadius: 15 }}
          resizeMode="contain"
        />

        {annotations.length > 0 ? (
          annotations.map((ann, i) => {
            const dispW = ann.width * screenW;
            const dispH = ann.height * screenH;
            const centerX = ann.x * screenW;
            const centerY = ann.y * screenH;
            const left = centerX - dispW / 2;
            const top = centerY - dispH / 2;

            return (
              <View key={i}>
                <View
                  style={[
                    styles.box,
                    { left, top, width: dispW, height: dispH },
                  ]}
                />
                <View
                  style={[
                    styles.boxLabelContainer,
                    {
                      left,
                      top:
                        top -
                        styles.boxLabelContainer.height -
                        styles.boxLabelContainer.paddingVertical * 2 -
                        4,
                      width: dispW,
                    },
                  ]}
                >
                  <Text
                    style={styles.boxLabel}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {translateLabel(ann.label)}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.noBoxText}>Aucune annotation détectée.</Text>
        )}
      </View>

      {/* BOUTON RETOUR À LA PAGE PRÉCÉDENTE */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Retour</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF6F0",
    padding: 10,
    alignItems: "center",
  },
  wrapper: {
    position: "relative",
    marginVertical: 20,
    backgroundColor: "#000", // placeholder
    borderRadius: 15,
    overflow: "hidden",
  },
  box: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "#E63946",
    borderRadius: 6,
    shadowColor: "#E63946",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    backgroundColor: "transparent",
  },
  boxLabelContainer: {
    position: "absolute",
    backgroundColor: "#FFF",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 3,
  },
  boxLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E63946",
    textAlign: "center",
    flexShrink: 1,
  },
  noBoxText: {
    position: "absolute",
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    alignSelf: "center",
    top: "50%",
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: "#E86A4A",
    borderRadius: 20,
    shadowColor: "#E86A4A",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
  },
  backButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});