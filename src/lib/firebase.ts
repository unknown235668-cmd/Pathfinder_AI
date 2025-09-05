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

// In a development environment, connect to the local Firebase Auth emulator
if (process.env.NODE_ENV === 'development') {
    // Note: Make sure you have the Firebase emulator suite running for this to work.
    // The default host and port for the auth emulator is http://127.0.0.1:9099
    try {
        connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    } catch (e) {
        console.warn('Could not connect to firebase auth emulator');
    }
}


export { app, db, auth };
