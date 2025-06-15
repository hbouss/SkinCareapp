// app.config.js
module.exports = {
  expo: {
    name: "SkinCoach",
    slug: "SkinCoach",            // ← passez tout en minuscules
    version: "1.0.0",
    sdkVersion: "47.0.0",
    platforms: ["ios", "android"],
    ios: {
      bundleIdentifier: "com.SkinCoach"
    },
    android: {
      package: "com.SkinCoach"
    },
    plugins: [
      "expo-dev-client",
      ["expo-camera", {
        cameraPermission: "Cette application utilise la caméra pour l’analyse de votre peau"
      }],
      ["expo-image-picker", {
        photosPermission: "Cette application accède à votre galerie pour choisir des photos"
      }]
    ],
    infoPlist: {
      NSCameraUsageDescription: "Cette app utilise la caméra pour analyser votre peau",
      NSPhotoLibraryUsageDescription: "Cette app accède à votre galerie pour charger des images"
    },
    android: {
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    extra: {
      eas: {
        projectId: "795d7fa4-1c1a-4502-a3c2-e2d8a08234f7"
      }
    }
  }
};