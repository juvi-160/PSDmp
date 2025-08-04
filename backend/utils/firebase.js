import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
dotenv.config();

console.log("FB_PROJECT_ID:", process.env.FB_PROJECT_ID);
console.log("FB_CLIENT_EMAIL:", process.env.FB_CLIENT_EMAIL);
console.log("FB_PRIVATE_KEY:", process.env.FB_PRIVATE_KEY ? "Exists" : "Missing");

if (!process.env.FB_PROJECT_ID || !process.env.FB_CLIENT_EMAIL || !process.env.FB_PRIVATE_KEY) {
  throw new Error("Missing Firebase admin credentials in environment variables");
}

const serviceAccount = {
  projectId:   process.env.FB_PROJECT_ID,
  clientEmail: process.env.FB_CLIENT_EMAIL,
  privateKey:  process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

initializeApp({
  credential: cert(serviceAccount)
});

// AuthAdmin is reusable across your app and easier to import in controllers
export const authAdmin = getAuth();
