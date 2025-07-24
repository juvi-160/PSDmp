import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ProfileService } from "../../core/services/profile.service";
import { User, ProfileUpdateData } from "../../core/models/user.model";
import { ToastService } from "../../core/services/toast.service";

// Firebase
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, Auth } from "firebase/auth";
import { firebaseConfig } from "../../environments/firebase-config";

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
    private toast: ToastService
  ) {
    const app = initializeApp(firebaseConfig);
    this.auth = getAuth(app);
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
      company: [""],
      position: [""],
      whyPsf: ["", [Validators.maxLength(500)]],
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
        this.areasOfInterest = user.areasOfInterest || [];
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
          whyPsf: user.whyPsf || "",
          agreedToTerms: user.agreedToTerms || false,
          agreedToContribute: user.agreedToContribute || false,
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

    const profileData: ProfileUpdateData = {
      phone: this.profileForm.get("phone")?.value || undefined,
      ageGroup: this.profileForm.get("ageGroup")?.value || undefined,
      profession: this.profileForm.get("profession")?.value || undefined,
      city: this.profileForm.get("city")?.value || undefined,
      company: this.profileForm.get("company")?.value || undefined,
      position: this.profileForm.get("position")?.value || undefined,
      areasOfInterest: this.areasOfInterest.length > 0 ? this.areasOfInterest : undefined,
      whyPsf: this.profileForm.get("whyPsf")?.value || undefined,
      agreedToTerms: this.profileForm.get("agreedToTerms")?.value || undefined,
      agreedToContribute: this.profileForm.get("agreedToContribute")?.value || undefined,
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
      this.profileForm.get("whyPsf")?.value,
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
      input.value = '';
    }
    event.preventDefault();
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
      rawPhone = "+92" + rawPhone; // Default to Pakistan country code
    }

    // Initialize Recaptcha
    window.recaptchaVerifier = new RecaptchaVerifier(
      this.auth,
      "recaptcha-container",
      {
        size: "normal",
        callback: () => {},
        "expired-callback": () => {
          this.toast.show("reCAPTCHA expired. Please try again.", "error");
        }
      }
    );

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