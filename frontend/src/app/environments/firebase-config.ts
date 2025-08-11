import { initializeApp, getApps, getApp } from 'firebase/app';
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
// const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
// const auth = getAuth(app);
// auth.useDeviceLanguage();

// export {auth};