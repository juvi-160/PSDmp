// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";


export const firebaseConfig = {
  apiKey: "AIzaSyC6__rQOqNeuW2nMJwiBAgXjw-7Fr6lDb4",
  authDomain: "psf-membership.firebaseapp.com",
  projectId: "psf-membership",
  storageBucket: "psf-membership.firebasestorage.app",
  messagingSenderId: "447894410735",
  appId: "1:447894410735:web:b915f6ed0963cb6af1521a",
  measurementId: "G-6C1FX4YNL3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);