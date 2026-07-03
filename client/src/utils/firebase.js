import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getEnv } from "./getEnv.js";

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
  appId: getEnv("VITE_FIREBASE_APP_ID"),
};

let auth = null;
let provider = null;

if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "dummy-api-key") {
  console.warn("⚠️ Firebase API key is missing or dummy. Google Login will be disabled.");
} else {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
  } catch (err) {
    console.error("⚠️ Failed to initialize Firebase:", err.message);
  }
}

export { auth, provider };
