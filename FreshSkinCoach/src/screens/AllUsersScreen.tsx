// src/screens/AllUsersScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { api } from "../api/client";

type UserAdmin = {
  id: string;
  email: string;
  is_admin: boolean;
  is_premium: boolean;
};

export default function AllUsersScreen() {
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get<UserAdmin[]>("/admin/users");
      setUsers(res.data);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de charger la liste des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const togglePremium = async (userId: string, newValue: boolean) => {
    try {
      await api.post(`/admin/users/${userId}/premium`, null, {
        params: { make_premium: newValue },
      });
      setUsers(u =>
        u.map(x =>
          x.id === userId ? { ...x, is_premium: newValue } : x
        )
      );
    } catch {
      Alert.alert("Erreur", "Impossible de modifier le statut");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E86A4A" />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={users}
      keyExtractor={u => u.id}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View>
            <Text style={styles.email}>{item.email}</Text>
            <Text style={styles.role}>
              {item.is_admin ? "Admin" : "Utilisateur"}
            </Text>
          </View>
          <View style={styles.switch}>
            <Text>Premium</Text>
            <Switch
              value={item.is_premium}
              onValueChange={v => togglePremium(item.id, v)}
            />
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 20 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#EEE",
  },
  email: { fontSize: 16, fontWeight: "500" },
  role: { fontSize: 12, color: "#666" },
  switch: { flexDirection: "row", alignItems: "center", gap: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});