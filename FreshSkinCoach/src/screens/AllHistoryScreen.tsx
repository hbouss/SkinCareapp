// src/screens/AllHistoryScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  SafeAreaView
} from "react-native";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export type SessionItem = {
  session_id: number;
  user_id: number;
  image_url: string;
  annotated_image_url?: string;
  scores: Record<string, number>;
  annotations: any[];
  timestamp: string;
};

export default function AllHistoryScreen() {
  const { user, signOut } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<SessionItem[]>("/skin/admin/history");
      setSessions(res.data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        setError("Accès non autorisé.");
      } else {
        setError("Erreur lors de la récupération des sessions.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  }, [fetchSessions]);

  useEffect(() => {
    if (user?.is_admin) fetchSessions();
  }, [fetchSessions, user]);

  if (!user?.is_admin) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Accès réservé aux administrateurs.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.session_id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.title}>Session #{item.session_id}</Text>
            <Text>User ID: {item.user_id}</Text>
            <Text>Date: {new Date(item.timestamp).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.center}>
            <Text>Aucune session trouvée.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF6F0" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4
  },
  errorText: {
    color: "#E86A4A",
    fontSize: 16
  }
});
