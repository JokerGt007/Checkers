import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAIgbZFQp7C-X4oyI-K0bT4RlzyFFOK7gM",
  authDomain: "damiumd007.firebaseapp.com",
  projectId: "damiumd007",
  storageBucket: "damiumd007.firebasestorage.app",
  messagingSenderId: "866331557633",
  appId: "1:866331557633:web:2c7ddac44cdbaec73c6500"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;