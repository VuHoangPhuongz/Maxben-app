// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6GHPj8rCumKGyJRvIneCJrA8fcm98Z7g",
  authDomain: "b2bweb-app.firebaseapp.com",
  projectId: "b2bweb-app",
  storageBucket: "b2bweb-app.appspot.com",
  messagingSenderId: "868675766167",
  appId: "1:868675766167:web:d45c3e9c712af8ea9666d2",
  measurementId: "G-MYSP5EWXQ6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);