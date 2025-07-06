const BACKEND_URL =
  process.env.APP_ENV === "production"
    ? "https://web-production-932b.up.railway.app"
    : "http://192.168.1.x:8000"; // votre URL locale

export { BACKEND_URL };