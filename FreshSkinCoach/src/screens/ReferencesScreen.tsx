import React from "react";
import { SafeAreaView, FlatList, TouchableOpacity, Linking, Text, StyleSheet } from "react-native";
import { REFERENCES } from "../data/references";

export default function ReferencesScreen() {
  const open = (url: string) => {
    Linking.canOpenURL(url).then(supported => supported && Linking.openURL(url));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Sources et références</Text>
      <FlatList
        data={REFERENCES}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => open(item.url)} style={styles.item} activeOpacity={0.8}>
            <Text style={styles.title}>{item.title}</Text>
            {item.desc && <Text style={styles.desc}>{item.desc}</Text>}
            <Text style={styles.link}>{item.url}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#E86A4A",
    textAlign: "center",
    marginBottom: 20,
  },
  item: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: "#555555",
    marginBottom: 12,
    lineHeight: 20,
    fontStyle: "italic",
  },
  link: {
    fontSize: 14,
    color: "#0066CC",
    textDecorationLine: "underline",
    marginTop: 4,
  },
});