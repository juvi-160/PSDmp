import { Component, OnInit, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Auth, RecaptchaVerifier, signInWithPhoneNumber } from '@angular/fire/auth';
import { ProfileService } from "../../core/services/profile.service";
import { User, ProfileUpdateData } from "../../core/models/user.model";
import { ToastService } from "../../core/services/toast.service";
import { Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';

@Component({
  selector: "app-profile",
  standalone: false,
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.css"],
})
export class ProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  private auth = inject(Auth);
  private router = inject(Router);

  // Form and User Data
  profileForm!: FormGroup;
  user: User | null = null;
  areasOfInterest: string[] = [];
  
  // UI States
  loading = false;
  saving = false;
  error = "";
  
  // Phone Verification
  otpSent = false;
  otpVerified = false;
  otpCode = '';
  confirmationResult: any = null;
  verifyingOtp = false;
  resendCountdown = 0;
  private countdownInterval: any;

  // reCAPTCHA
  private recaptchaVerifier?: RecaptchaVerifier;
  private recaptchaContainerId = 'recaptcha-container-' + Math.random().toString(36).substring(2);

  // Form Options
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
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadProfile();
  }

  async ngAfterViewInit(): Promise<void> {
    await this.initializeRecaptcha();
  }

  ngOnDestroy(): void {
    this.cleanupRecaptcha();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private async initializeRecaptcha(): Promise<void> {
    this.cleanupRecaptcha();

    // Create container if it doesn't exist
    let container = document.getElementById(this.recaptchaContainerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.recaptchaContainerId;
      container.style.display = 'none';
      document.body.appendChild(container);
    }

    try {
      this.recaptchaVerifier = new RecaptchaVerifier(
        this.auth,
        this.recaptchaContainerId,
        {
          size: 'invisible',
          callback: () => console.log("reCAPTCHA solved"),
          'expired-callback': () => {
            console.log("reCAPTCHA expired");
            this.cleanupRecaptcha();
          }
        },
      );

      await this.recaptchaVerifier.render();
    } catch (error) {
      console.error('reCAPTCHA initialization error:', error);
      this.toast.show('Failed to initialize security verification. Please refresh the page.', 'error');
    }
  }

  private cleanupRecaptcha(): void {
    if (this.recaptchaVerifier) {
      try {
        this.recaptchaVerifier.clear();
      } catch (error) {
        console.warn('Error clearing reCAPTCHA:', error);
      }
      this.recaptchaVerifier = undefined;
    }

    const container = document.getElementById(this.recaptchaContainerId);
    if (container) {
      container.remove();
    }
  }

  private startCountdown(): void {
    this.resendCountdown = 60;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
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
        this.areasOfInterest = typeof user.area_of_interests === 'string'
          ? JSON.parse(user.area_of_interests || '[]')
          : user.area_of_interests || [];

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
          areaOfInterests: this.areasOfInterest,
          aboutYou: user.about_you || "",
          agreedToTerms: user.agreed_to_terms || false,
          agreedToContribute: user.agreed_to_contribute || false,
        });

        this.loading = false;
      },
      error: () => {
        this.error = "Failed to load profile. Please try again.";
        this.loading = false;
      }
    });
  }

  async sendOTP(): Promise<void> {
    const phoneNumber = this.profileForm.get('phone')?.value;
    if (!phoneNumber) {
      this.toast.show('Please enter a valid phone number', 'error');
      return;
    }

    if (!this.phoneNumberValid(phoneNumber)) {
      this.toast.show('Please enter phone number in international format (+countrycodenumber)', 'error');
      return;
    }

    if (!this.recaptchaVerifier) {
      await this.initializeRecaptcha();
      if (!this.recaptchaVerifier) {
        this.toast.show('Security verification failed. Please refresh the page.', 'error');
        return;
      }
    }

    this.loading = true;
    try {
      this.confirmationResult = await signInWithPhoneNumber(
        this.auth,
        phoneNumber,
        this.recaptchaVerifier!
      );
      this.otpSent = true;
      this.startCountdown();
      this.toast.show('Verification code sent successfully!', 'success');
    } catch (error: any) {
      console.error('OTP send error:', error);
      let errorMessage = 'Failed to send verification code';
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later';
      }
      
      this.toast.show(errorMessage, 'error');
    } finally {
      this.loading = false;
    }
  }

  verifyOTP(): void {
    if (!this.confirmationResult) {
      this.toast.show('Please request verification code first', 'error');
      return;
    }

    if (!this.otpCode || this.otpCode.length !== 6) {
      this.toast.show('Please enter the 6-digit verification code', 'error');
      return;
    }

    this.verifyingOtp = true;
    this.confirmationResult.confirm(this.otpCode)
      .then(() => {
        this.verifyingOtp = false;
        this.otpVerified = true;
        this.toast.show('Phone number verified successfully!', 'success');

        // Update verification status in backend
        this.profileService.markPhoneVerified().subscribe({
          next: () => this.onSubmit(),
          error: (err) => {
            console.error('Error updating verification status:', err);
            this.toast.show('Profile saved but verification status not updated');
          }
        });
      })
      .catch((error : FirebaseError) => {
        this.verifyingOtp = false;
        console.error('OTP verification failed:', error);
        this.toast.show('Invalid verification code. Please try again.');
      });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.toast.show('Please complete all required fields', 'error');
      return;
    }

    this.saving = true;

    const profileData: ProfileUpdateData = {
      phone: this.profileForm.get("phone")?.value || undefined,
      ageGroup: this.profileForm.get("ageGroup")?.value || undefined,
      profession: this.profileForm.get("profession")?.value || undefined,
      city: this.profileForm.get("city")?.value || undefined,
      company: this.profileForm.get("company")?.value || undefined,
      position: this.profileForm.get("position")?.value || undefined,
      area_of_interests: this.areasOfInterest,
      about_you: this.profileForm.get("aboutYou")?.value || undefined,
      agreed_to_terms: this.profileForm.get("agreedToTerms")?.value || undefined,
      agreed_to_contribute: this.profileForm.get("agreedToContribute")?.value || undefined,
    };

    this.profileService.updateUserProfile(profileData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.saving = false;
        this.toast.show('Profile updated successfully!', 'success');
      },
      error: (error) => {
        this.saving = false;
        console.error('Profile update error:', error);
        this.toast.show('Failed to update profile. Please try again.', 'error');
      },
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

  removeInterest(interest: string): void {
    const index = this.areasOfInterest.indexOf(interest);
    if (index >= 0) {
      this.areasOfInterest.splice(index, 1);
      this.profileForm.get('areaOfInterests')?.setValue([...this.areasOfInterest]);
    }
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

  getProfileCompletionPercentage(): number {
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

  resetForm(): void {
    if (this.user) {
      this.profileForm.patchValue({
        phone: this.user.phone || "",
        ageGroup: this.user.ageGroup || "",
        profession: this.user.profession || "",
        city: this.user.city || "",
        company: this.user.company || "",
        position: this.user.position || "",
        aboutYou: this.user.about_you || "",
        agreedToTerms: this.user.agreed_to_terms || false,
        agreedToContribute: this.user.agreed_to_contribute || false,
      });
      this.areasOfInterest = typeof this.user.area_of_interests === 'string'
        ? JSON.parse(this.user.area_of_interests || '[]')
        : this.user.area_of_interests || [];
    }
  }

  formatRoleName(role: string | undefined): string {
    if (!role) return '';
    return role.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
}