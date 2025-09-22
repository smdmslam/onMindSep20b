import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDheNF1cZyK7Cue-FEXxInumgfiMkzr3Uo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "onmind.cc",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "onmindsep20",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "onmindsep20.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "690745713338",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:690745713338:web:1723fad95ad9e3d5435883",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-KGNS2ND4WD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
