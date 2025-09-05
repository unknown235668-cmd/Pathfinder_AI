import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "pathfinder-ai-xsk6g",
  appId: "1:686789703927:web:cd9cfb6ea066e1a52f7bf2",
  storageBucket: "pathfinder-ai-xsk6g.firebasestorage.app",
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "pathfinder-ai-xsk6g.firebaseapp.com",
  messagingSenderId: "686789703927",
};

// Initialize Firebase
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// This is the normal Firestore instance for the client-side
const db: Firestore = getFirestore(app);

// This is a special Firestore instance for server-side use (Genkit flows)
// It is initialized with long-polling to work in serverless environments.
let firestore: Firestore;
try {
  firestore = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch (e) {
  firestore = getFirestore(app);
}

const auth = getAuth(app);

export { app, db, auth, firestore };
