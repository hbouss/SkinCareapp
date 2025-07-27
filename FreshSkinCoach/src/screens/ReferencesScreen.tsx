// src/screens/ReferencesScreen.tsx
import React from "react";
import { View, Text, FlatList, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { REFERENCES } from "../data/references";

export default function ReferencesScreen() {
  const open = (url: string) => {
    Linking.canOpenURL(url).then(supported => supported && Linking.openURL(url));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sources et références</Text>
      <FlatList
        data={REFERENCES}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => open(item.url)} style={styles.item}>
            <Text style={styles.title}>{item.title}</Text>
            {item.desc && <Text style={styles.desc}>{item.desc}</Text>}
            <Text style={styles.link}>{item.url}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#FFF" },
  header:    { fontSize: 22, fontWeight: "600", marginBottom: 15 },
  item:      { marginBottom: 20 },
  title:     { fontSize: 16, fontWeight: "500" },
  desc:      { fontSize: 14, color: "#555", marginVertical: 4 },
  link:      { fontSize: 12, color: "#0066CC" },
});