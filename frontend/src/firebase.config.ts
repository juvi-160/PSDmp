
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyAmRwzDEIWXOBPkB77fNZT5MFPrvIOkZjQ",
  authDomain: "psf-sms.firebaseapp.com",
  projectId: "psf-sms",
  storageBucket: "psf-sms.firebasestorage.app",
  messagingSenderId: "88557324244",
  appId: "1:88557324244:web:2accb2d98f8722a5fbf841",
  measurementId: "G-0Z0ZS86GC8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth, RecaptchaVerifier };