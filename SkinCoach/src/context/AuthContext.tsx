// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api/client";

// Définition du type utilisateur complet, incluant is_admin et subscription_expiry
type UserType = {
  id: string;
  email: string;
  is_admin: boolean;
  subscription_expiry: string | null;
};

type AuthContextType = {
  user: UserType | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);

  const signIn = async (email: string, password: string) => {
    try {
      // 1) Connexion et récupération du token
      const body = new URLSearchParams();
      body.append("username", email);
      body.append("password", password);

      const res = await api.post("/auth/login", body.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const { access_token } = res.data;
      await AsyncStorage.setItem("access_token", access_token);

      // 2) Fetch du statut d'abonnement (renvoie l'utilisateur complet)
      const statusRes = await api.get<UserType>("/subscription/status");
      setUser(statusRes.data);
    } catch (err: any) {
      console.log("=== signIn error response ===");
      if (err.response) {
        console.log("status:", err.response.status);
        console.log("data:", err.response.data);
      } else {
        console.log(err.message);
      }
      throw err;
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
