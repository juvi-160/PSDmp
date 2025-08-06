import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier } from 'firebase/auth';

// ✅ Your actual Firebase config (from Firebase console)
export const firebaseConfig = {
  apiKey: "AIzaSyC6__rQOqNeuW2nMJwiBAgXjw-7Fr6lDb4",
  authDomain: "psf-membership.firebaseapp.com",
  projectId: "psf-membership",
  storageBucket: "psf-membership.appspot.com",
  messagingSenderId: "447894410735",
  appId: "1:447894410735:web:b915f6ed0963cb6af1521a",
  measurementId: "G-6C1FX4YNL3"
};

// ✅ Initialize only once
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };

