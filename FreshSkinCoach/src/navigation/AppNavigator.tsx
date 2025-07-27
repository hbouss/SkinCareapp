// src/navigation/AppNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import HomeScreen from "../screens/HomeScreen";
import CameraScreen from "../screens/CameraScreen";
import HistoryScreen from "../screens/HistoryScreen";
import StatsScreen from "../screens/StatsScreen";
import DashboardScreen from "../screens/DashboardScreen";
import AllHistoryScreen from "../screens/AllHistoryScreen";

import { useAuth } from "../context/AuthContext";
import ImageDetailScreen from "../screens/ImageDetailScreen";
import SubscriptionScreen from "@/src/screens/SubscriptionScreen";
import AllUsersScreen from "@/src/screens/AllUsersScreen";
import ReferencesScreen from "../screens/ReferencesScreen";

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  Camera: undefined;
  History: undefined;
  Stats: undefined;
  Subscription: undefined;   // écran d’abonnement
  AllHistory: undefined;    // historique global admin
  AllUsers: undefined;
  References:  undefined;
  Dashboard: {
    session: {
      session_id: number;
      image_url: string;
      annotated_image_url: string;
      scores: Record<string, number>;
      annotations: Array<{ x: number; y: number; width: number; height: number; label: string; }>;
      timestamp: string;
    };
  };
  ImageDetail: {
    image_url: string;
    annotations: Array<{ x: number; y: number; width: number; height: number; label: string; }>;
    };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator
      id={undefined}
      initialRouteName={user ? "Home" : "Login"}
      screenOptions={{ headerShown: false }}
    >
      {user ? (
        // On regroupe ici nos écrans protégés dans un Fragment vide
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Stats" component={StatsScreen} />

          <Stack.Screen name="Subscription" component={SubscriptionScreen} />

          <Stack.Screen name="References" component={ReferencesScreen} options={{ title: "Sources" }} />

          {/* Écran historique global (admin) */}
          <Stack.Screen name="AllHistory" component={AllHistoryScreen} />
          <Stack.Screen name="AllUsers" component={AllUsersScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="ImageDetail" component={ImageDetailScreen} />
        </>
      ) : (
        // Pareil pour les écrans non-authentifiés
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}