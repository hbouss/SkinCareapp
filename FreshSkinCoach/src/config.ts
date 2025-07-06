// src/config.ts

// __DEV__ est fourni par React Native : true en mode développement, false en build release
export const BACKEND_URL = __DEV__
  ? "http://192.168.1.38:8000"                    // votre API locale
  : "https://web-production-932b.up.railway.app";  // votre URL Railway (sans slash final)