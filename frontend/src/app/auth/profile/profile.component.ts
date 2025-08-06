import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfileService } from "../../core/services/profile.service";
import { User, ProfileUpdateData } from "../../core/models/user.model";
import { ToastService } from "../../core/services/toast.service";
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ConfirmationResult, signInWithPhoneNumber } from 'firebase/auth';
import { Router } from '@angular/router';
import { FirebaseApp } from '@angular/fire/compat';
import { Auth, RecaptchaVerifier } from "firebase/auth";


@Component({
  selector: "app-profile",
  standalone: false,
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.css"],
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileForm!: FormGroup;
  user: User | null = null;
  loading = false;
  saving = false;
  error = "";
  otpSent = false;
  otpVerified = false;
  phoneOTP = "";
  confirmationResult: ConfirmationResult | null = null;
  verifyingOtp = false;
  areasOfInterest: string[] = [];
  otpCode: string = '';
  recaptchaVerifier!: RecaptchaVerifier;
  resendCountdown = 0;
  private countdownInterval: any;

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
    private afAuth: AngularFireAuth,
    private router: Router,
    private ngZone: NgZone,
    private auth: Auth
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadProfile();
    this.initializeRecaptcha();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
    }
  }

  initializeRecaptcha() {
  this.recaptchaVerifier = new RecaptchaVerifier(
    'recaptcha-container', 
    {
      size: 'invisible'
    },
    this.afAuth
  );
}

  startCountdown(): void {
    this.resendCountdown = 60;
    this.countdownInterval = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
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

  sendOTP(): void {
    const phoneNumber = this.profileForm.get('phone')?.value;
    if (!phoneNumber) return;

    this.loading = true;
    this.startCountdown();
    this.afAuth.signInWithPhoneNumber(phoneNumber, this.recaptchaVerifier)
      .then((conf: any) => {
        this.confirmationResult = conf;
        this.otpSent = true;
        this.toast.show('OTP sent successfully!', 'success');
      })
      .catch(err => {
        console.error(err);
        this.resendCountdown = 0;
        clearInterval(this.countdownInterval);
        this.toast.show(err.code === 'auth/invalid-phone-number'
          ? 'Invalid phone number.'
          : err.code === 'auth/too-many-requests'
            ? 'Too many requests.'
            : 'Failed to send OTP.', 'error');
      })
      .finally(() => {
        this.loading = false;
      });
  }


  phoneNumberValid(phoneNumber: string): boolean {
    return /^\+[1-9]\d{1,14}$/.test(phoneNumber);
  }

  onOtpChange(): void {
    if (this.otpCode.length === 6) {
      this.verifyOTP();
    }
  }

  verifyOTP(): void {
    if (!this.confirmationResult) {
      this.toast.show("Please request OTP first", "error");
      return;
    }

    if (!this.otpCode || this.otpCode.length !== 6) {
      this.toast.show("Please enter a valid 6-digit OTP", "error");
      return;
    }

    this.verifyingOtp = true;

    this.confirmationResult.confirm(this.otpCode)
      .then(() => {
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
    this.profileForm.reset();
    this.areasOfInterest = [];

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
}