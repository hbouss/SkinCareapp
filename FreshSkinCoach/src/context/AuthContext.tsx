// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api/client";


export const FREE_ANALYSIS_LIMIT = 3;

// Ne conservez que les champs réellement renvoyés par /auth/me
type UserType = {
  id: string;
  email: string;
  is_admin: boolean;
  is_premium: boolean;
};

type AuthContextType = {
  user: UserType | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  analyzeSkin: (file: FormData) => Promise<any>;
  subscribe: (receipt: string, platform: "apple" | "google") => Promise<void>;
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

      // 2) Récupérer l'utilisateur via /auth/me
      const meRes = await api.get<UserType>("/auth/me");
      setUser(meRes.data);
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

    /**
   * Envoie la photo au bon endpoint en gérant le quota gratuit ou le statut premium.
   */
  const analyzeSkin = async (form: FormData) => {
  if (!user) throw new Error("Utilisateur non connecté");

  // 1) Si non-Premium, on vérifie le quota
  if (!user.is_premium) {
    const histRes = await api.get("/skin/history", {
      params: { limit: FREE_ANALYSIS_LIMIT + 1 },
    });
    if (histRes.data.length >= FREE_ANALYSIS_LIMIT) {
      throw new Error(
        `Limite gratuite atteinte (${FREE_ANALYSIS_LIMIT} analyses). Passez Premium.`
      );
    }
  }


    // 3) Choix de l'URL
    const url = user.is_premium
      ? "/skin/analyze-premium"
      : "/skin/analyze";

    const res = await api.post(url, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  };


   /**
  * Enregistre un reçu d'achat et met à jour user.is_premium
  */
 const subscribe = async () => {
    if (!user) throw new Error("Utilisateur non connecté");
    // valeurs factices pour tester
    const dummyReceipt = "DEV_RECEIPT";
    const dummyPlatform: "apple" | "google" = "apple";

    await api.post("/subscription/validate", {
      receipt: dummyReceipt,
      platform: dummyPlatform,
    });

    // on rafraîchit l’utilisateur pour récupérer is_premium
    const me = await api.get<UserType>("/auth/me");
    setUser(me.data);
  };

  return (
    <AuthContext.Provider
      value={{ user, signIn, signOut, analyzeSkin, subscribe }}
    >
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