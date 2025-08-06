import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ProfileService } from "../../core/services/profile.service";
import { User, ProfileUpdateData } from "../../core/models/user.model";
import { ToastService } from "../../core/services/toast.service";
import { Injectable } from '@angular/core';

// Firebase
import { initializeApp, getApps } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, Auth } from "firebase/auth";
import { firebaseConfig } from "../../environments/firebase-config";


@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private authInstance: Auth;

  constructor() {
    if (!getApps().length) {
      initializeApp(firebaseConfig);
    }
    this.authInstance = getAuth();
  }

  getAuth(): Auth {
    return this.authInstance;
  }
}


declare global {
  interface Window {
    recaptchaVerifier: any;
    recaptchaWidgetId: any;
  }
}


@Component({
  selector: "app-profile",
  standalone: false,
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.css"],
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  user: User | null = null;
  loading = false;
  saving = false;
  error = "";
  otpSent = false;
  otpVerified = false;
  phoneOTP = "";
  confirmationResult!: ConfirmationResult;
  verifyingOtp = false;
  areasOfInterest: string[] = [];
  otpCode: string = '';
  recaptchaVerifier!: RecaptchaVerifier;

  private auth: Auth;

  ageGroups = [
    { value: "Under 18", label: "Under 18 years" },
    { value: "18-25", label: "18-25 years" },
    { value: "26-35", label: "26-35 years" },
    { value: "36-50", label: "36-50 years" },
    { value: "51+", label: "51+ years" },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private profileService: ProfileService,
    private toast: ToastService,
    private firebaseService: FirebaseService
  ) {
    this.auth = this.firebaseService.getAuth();
  }

  ngOnInit(): void {
    this.initForm();
    this.loadProfile();
  }



  initForm(): void {
    this.profileForm = this.formBuilder.group({
      name: [{ value: "", disabled: true }],
      email: [{ value: "", disabled: true }],
      phone: ["", [Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      ageGroup: [""],
      profession: ["", [Validators.maxLength(100)]],
      city: ["", [Validators.maxLength(50)]],
      areaOfInterests: [[]],
      company: [""],
      position: [""],
      aboutYou: ["", [Validators.maxLength(500)]],
      agreedToTerms: [false, Validators.requiredTrue],
      agreedToContribute: [false],
    });
  }

  loadProfile(): void {
    this.loading = true;
    this.error = "";

    this.profileService.getUserProfile().subscribe({
      next: (user) => {
        this.user = user;
        if (typeof user.area_of_interests === 'string') {
          try {
            this.areasOfInterest = JSON.parse(user.area_of_interests);
          } catch (e) {
            console.error('Failed to parse areas_of_interests:', e);
            this.areasOfInterest = [];
          }
        } else {
          this.areasOfInterest = user.area_of_interests || [];
        }

        this.otpVerified = user.isPhoneVerified || false;

        this.profileForm.patchValue({
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          ageGroup: user.ageGroup || "",
          profession: user.profession || "",
          city: user.city || "",
          company: user.company || "",
          position: user.position || "",
          areaOfInterests: user.area_of_interests || [],
          aboutYou: user.about_you || "",
          agreedToTerms: user.agreed_to_terms || false,
          agreedToContribute: user.agreed_to_contribute || false,
        });

        this.loading = false;
      },
      error: (error) => {
        this.error = "Failed to load profile. Please try again.";
        this.loading = false;
        console.error("Error loading profile:", error);
      },
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;
    this.saving = true;

    const areaOfInterestsValue = this.profileForm.get("areaOfInterests")?.value;

    const profileData: ProfileUpdateData = {
      phone: this.profileForm.get("phone")?.value || undefined,
      ageGroup: this.profileForm.get("ageGroup")?.value || undefined,
      profession: this.profileForm.get("profession")?.value || undefined,
      city: this.profileForm.get("city")?.value || undefined,
      company: this.profileForm.get("company")?.value || undefined,
      position: this.profileForm.get("position")?.value || undefined,
      area_of_interests: Array.isArray(areaOfInterestsValue) && areaOfInterestsValue.length > 0 ? areaOfInterestsValue : undefined,
      about_you: this.profileForm.get("aboutYou")?.value || undefined,
      agreed_to_terms: this.profileForm.get("agreedToTerms")?.value || undefined,
      agreed_to_contribute: this.profileForm.get("agreedToContribute")?.value || undefined,
    };


    this.profileService.updateUserProfile(profileData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.saving = false;
        this.toast.show("Profile updated successfully!", "success");
      },
      error: (error) => {
        this.saving = false;
        console.error("Error updating profile:", error);
        this.toast.show("Failed to update profile. Please try again.", "error");
      },
    });
  }

  removeInterest(interest: string): void {
    const index = this.areasOfInterest.indexOf(interest);
    if (index >= 0) {
      this.areasOfInterest.splice(index, 1);
      this.profileForm.get('areaOfInterests')?.setValue([...this.areasOfInterest]);
    }
  }


  getProfileCompletionPercentage(): number {
    if (!this.profileForm) return 0;

    const fields = [
      this.profileForm.get("phone")?.value,
      this.profileForm.get("ageGroup")?.value,
      this.profileForm.get("profession")?.value,
      this.profileForm.get("city")?.value,
      this.profileForm.get("company")?.value,
      this.profileForm.get("position")?.value,
      this.profileForm.get("aboutYou")?.value,
      this.areasOfInterest.length > 0 ? "yes" : "",
      this.profileForm.get("agreedToTerms")?.value ? "yes" : "",
    ];

    const completedFields = fields.filter((field) => !!field && field.toString().trim().length > 0).length;
    return Math.round((completedFields / fields.length) * 100);
  }

  formatRoleName(role: string | undefined): string {
    if (!role) return '';
    return role.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  addInterest(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (value && !this.areasOfInterest.includes(value)) {
      this.areasOfInterest.push(value);
      this.profileForm.get('areaOfInterests')?.setValue([...this.areasOfInterest]);
      input.value = '';
    }
    event.preventDefault();
  }

  resetForm(): void {
    this.profileForm.reset(); // Clears the form
    this.areasOfInterest = []; // Clears chip tags or other custom arrays

    // Optionally reset form controls manually if needed:
    this.profileForm.patchValue({
      areaOfInterests: [],
      ageGroup: '',
      profession: '',
      city: '',
      whyPsf: '',
      company: '',
      position: '',
      agreedToContribute: false,
      agreedToTerms: false,
      phone: ''
    });
  }

  sendOTP(): void {
    let rawPhone = this.profileForm.get("phone")?.value;

    if (!rawPhone || rawPhone.length < 10) {
      this.toast.show("Please enter a valid phone number", "error");
      return;
    }

    // Convert to E.164 format if not already
    rawPhone = rawPhone.trim();
    if (!rawPhone.startsWith("+")) {
      rawPhone = "+91" + rawPhone; // Default to India country code
    }

    // // Initialize Recaptcha
    // window.recaptchaVerifier = new RecaptchaVerifier(
    //   this.auth,
    //   "recaptcha-container",
    //   {
    //     size: "normal",
    //     callback: () => { },
    //     "expired-callback": () => {
    //       this.toast.show("reCAPTCHA expired. Please try again.", "error");
    //     }
    //   }
    // );

    // Check for DOM existence
    const recaptchaContainer = document.getElementById("recaptcha-container");
    if (!recaptchaContainer) {
      console.error("reCAPTCHA container not found");
      this.toast.show("reCAPTCHA container missing", "error");
      return;
    }

    // Initialize reCAPTCHA only once
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        this.auth,
        "recaptcha-container", // You can just use the ID string directly
        {
          size: "invisible",
          callback: (response: any) => {
            // reCAPTCHA solved
          },
          "expired-callback": () => {
            this.toast.show("reCAPTCHA expired. Please try again.", "error");
          },
        }
      );

      if (!window.recaptchaWidgetId) {
        window.recaptchaVerifier.render().then((widgetId: any) => {
          window.recaptchaWidgetId = widgetId;
        });
      }

    }

    // Send OTP
    signInWithPhoneNumber(this.auth, rawPhone, window.recaptchaVerifier)
      .then((confirmationResult) => {
        this.confirmationResult = confirmationResult;
        this.otpSent = true;
        this.toast.show("OTP sent successfully!", "success");
      })
      .catch((error) => {
        console.error("OTP send error:", error);
        this.toast.show("Failed to send OTP. " + error.message, "error");
      });



  }

  verifyOTPAndSave(): void {
    if (!this.phoneOTP || this.phoneOTP.length < 6) {
      this.toast.show("Please enter a valid 6-digit OTP", "error");
      return;
    }

    if (this.otpVerified) {
      this.toast.show("Phone already verified.", "info");
      return;
    }

    this.verifyingOtp = true;

    this.confirmationResult
      .confirm(this.phoneOTP)
      .then((result) => {
        this.verifyingOtp = false;
        this.otpVerified = true;
        this.toast.show("Phone number verified!", "success");

        // Update phone verification status with backend
        this.profileService.markPhoneVerified().subscribe({
          next: () => {
            this.onSubmit(); // Submit the form after verification
          },
          error: (err: any) => {
            console.error("Error updating phone verification:", err);
            this.toast.show("Profile saved but phone verification status not updated", "error");
          }
        });
      })


      .catch((error) => {
        this.verifyingOtp = false;
        console.error("OTP verification failed:", error);
        this.toast.show("Invalid OTP. Please try again.", "error");
      });
  }


}

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}