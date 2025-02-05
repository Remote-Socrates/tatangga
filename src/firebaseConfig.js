import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAEgizto0KqYHozOjbJLuc31h1_70I6g-w",
  authDomain: "tatangga-e8b85.firebaseapp.com",
  projectId: "tatangga-e8b85",
  storageBucket: "tatangga-e8b85.firebasestorage.app",
  messagingSenderId: "482180386458",
  appId: "1:482180386458:web:57c1addbdeeea215e79923",
  measurementId: "G-83NT1DBJS5",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
