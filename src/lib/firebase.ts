import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  projectId: "pathfinder-ai-xsk6g",
  appId: "1:686789703927:web:cd9cfb6ea066e1a52f7bf2",
  storageBucket: "pathfinder-ai-xsk6g.firebasestorage.app",
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "pathfinder-ai-xsk6g.firebaseapp.com",
  messagingSenderId: "686789703927",
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
