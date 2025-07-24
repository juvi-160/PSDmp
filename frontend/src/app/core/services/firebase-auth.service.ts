import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, Auth } from 'firebase/auth';
import { firebaseConfig } from '../../environments/firebase-config';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  private auth: Auth;

  constructor() {
    const app = initializeApp(firebaseConfig);
    this.auth = getAuth(app);
  }

  setupReCAPTCHA(containerId: string): RecaptchaVerifier {
    // Remove any existing reCAPTCHA widget
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch {}
      (window as any).recaptchaVerifier = undefined;
    }

    // Ensure the container exists and is empty
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = "";

    const verifier = new RecaptchaVerifier(
      this.auth,
      containerId,
      {
        size: 'normal', // Use 'normal' for visible widget
        callback: () => {},
        'expired-callback': () => {}
      }
    );
    (window as any).recaptchaVerifier = verifier;
    return verifier;
  }

  async sendOTP(phoneNumber: string, verifier: RecaptchaVerifier): Promise<ConfirmationResult> {
    try {
      return await signInWithPhoneNumber(this.auth, phoneNumber, verifier);
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  async verifyOTP(confirmationResult: ConfirmationResult, otp: string): Promise<any> {
    try {
      return await confirmationResult.confirm(otp);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }
}