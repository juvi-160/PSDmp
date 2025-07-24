// src/app/environments/firebase-config.ts

import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: "AIzaSyAmRwzDEIWXOBPkB77fNZT5MFPrvIOkZjQ",
  authDomain: "psf-sms.firebaseapp.com",
  projectId: "psf-sms",
  storageBucket: "psf-sms.appspot.com", // ✅ Corrected
  messagingSenderId: "88557324244",
  appId: "1:88557324244:web:2accb2d98f8722a5fbf841",
  measurementId: "G-0Z0ZS86GC8"
};

// ✅ Initialize and export Firebase app
export const firebaseApp = initializeApp(firebaseConfig);

// ✅ Optionally export analytics
export const analytics = getAnalytics(firebaseApp);
