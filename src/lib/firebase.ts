import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDheNF1cZyK7Cue-FEXxInumgfiMkzr3Uo",
  authDomain: "onmindsep20.firebaseapp.com",
  projectId: "onmindsep20",
  storageBucket: "onmindsep20.firebasestorage.app",
  messagingSenderId: "690745713338",
  appId: "1:690745713338:web:1723fad95ad9e3d5435883",
  measurementId: "G-KGNS2ND4WD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
