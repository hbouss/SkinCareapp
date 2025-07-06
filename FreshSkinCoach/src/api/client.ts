import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKEND_URL } from "../config";

// export const API_BASE = "http://192.168.1.38:8000";

export const api = axios.create({
  baseURL: BACKEND_URL,
});

// Injecte automatiquement le token si présent
api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor pour gérer 401 (logout automatique)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // TODO: déconnecter l'utilisateur
    }
    return Promise.reject(err);
  }
);