import { Component, OnInit, OnDestroy, AfterViewInit, inject } from "@angular/core";
import { Router } from "@angular/router";
import { FormBuilder, FormGroup, Validators, FormControl } from "@angular/forms";
import { Auth, RecaptchaVerifier, signInWithPhoneNumber } from '@angular/fire/auth';
import { SubscriptionService, PresetPlan, DynamicPlan, SubscriptionWithPayment } from "../core/services/subscription.service";
import { AuthService } from "../core/services/auth.service";
import { environment } from "../environments/environment";
import { ToastService } from "../core/services/toast.service";

import { ProfileUpdateData } from "../core/models/user.model";
declare var Razorpay: any;

// Firebase
import { FirebaseError } from 'firebase/app';


interface PaymentDetailsBase {
  orderId: string;
  amount: number;
  currency: string;
  status: "created" | "paid" | "failed";
  paymentId?: string;
  paymentDate?: Date;
  formattedAmount?: string;
}

interface PaymentHistory {
  id: number;
  orderId: string;
  amount: number;
  currency: string;
  status: "created" | "paid" | "failed";
  paymentId?: string;
  paymentDate: Date;
  formattedAmount: string;
  isSubscription: boolean;
  subscriptionId?: string;
  notes?: any;
}

interface User {
  id?: string;
  auth0Id?: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "individual member" | "associate member" | "pending";
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  hasPaid?: boolean;
  phoneVerificationCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
  ageGroup?: "18-25" | "26-35" | "36-45" | "46-55" | "56-65" | "65+";
  profession?: string;
  city?: string;
  area_of_interests?: string[];
  about_you?: string;
  profilePicture?: string;
  profileCompleted?: boolean;
  autoPayEnabled?: boolean;
  subscriptionId?: string;
  subscriptionStatus?: "active" | "inactive" | "cancelled";
  paymentDetails?: PaymentDetailsBase;
  paymentHistory?: PaymentHistory[];
  totalPaymentAmount?: number;
  formattedPaymentAmount?: string;
  company?: string;
  position?: string;
  agreed_to_terms?: boolean;
  agreed_to_contribute?: boolean;
}

@Component({
  selector: 'app-payment',
  standalone: false,
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit, AfterViewInit, OnDestroy {
  private auth = inject(Auth);

  // Form and user state
  profileForm: FormGroup;
  user: User | null = null;
  areasOfInterest: string[] = [];

  //ui states
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

  // Payment state
  selectedAmount = 0;
  presetPlans: PresetPlan[] = [];
  paymentType: "one-time" | "autopay" = "one-time";
  isAmountValid = false;
  showMinimumError = false;
  customAmountControl = new FormControl("", [Validators.required, Validators.min(300), Validators.pattern(/^\d+$/)]);
  contributionReason: string = '';
  paymentProcessing = false;

  // Profile data
  profileCompleted = false;
  profileCompletionPercentage = 0;

  // reCAPTCHA
  private recaptchaVerifier?: RecaptchaVerifier;
  private recaptchaContainerId = 'recaptcha-container-' + Math.random().toString(36).substring(2);


  ageGroups = [
    { value: "18-25", label: "18-25 years" },
    { value: "26-35", label: "26-35 years" },
    { value: "36-45", label: "36-45 years" },
    { value: "46-55", label: "46-55 years" },
    { value: "56-65", label: "56-65 years" },
    { value: "65+", label: "65+ years" }
  ];

  constructor(
    private subscriptionService: SubscriptionService,
    private authService: AuthService,
    private router: Router,// Inject Router
    private toast: ToastService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      name: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      phone: ['', [Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      ageGroup: [''],
      otpCode: [''], // Add this line
      profession: ['', [Validators.required, Validators.maxLength(100)]],
      city: ['', [Validators.required, Validators.maxLength(50)]],
      company: [''],
      position: [''],
      aboutYou: ['', [Validators.required, Validators.maxLength(500)]],
      agreedToTerms: [false, Validators.requiredTrue],
      agreedToContribute: [false]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadPresetPlans();
    this.loadRazorpayScript();
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



  loadUserProfile(): void {
    this.loading = true;
    this.authService.currentUser.subscribe({
      next: (user: User | null) => {
        console.log('API Response:', JSON.stringify(user, null, 2));
        if (!user) {
          this.router.navigate(["/"]);
          return;
        }

        this.user = {
          ...user,
          id: user.id ?? '',
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: !!user.isEmailVerified,
          isPhoneVerified: !!user.isPhoneVerified,
          hasPaid: !!user.hasPaid,
          profileCompleted: !!user.profileCompleted,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };

        this.profileCompleted = this.user.profileCompleted || false;

        // Handle redirection based on user role and status
        if (this.profileCompleted) {
          if (this.user.role === 'associate member') {
            // Associate members can proceed to dashboard after profile completion
            this.router.navigate(["/dashboard"]);
            return;
          } else if (this.user.hasPaid) {
            // Other members need to have paid to go to dashboard
            this.router.navigate(["/dashboard"]);
            return;
          }
        }

        this.initProfileForm(this.user);
        this.checkProfileCompletion();
        this.loading = false;
      },
      error: (error) => {
        this.error = "Failed to load profile. Please try again.";
        this.loading = false;
        console.error("Error loading profile:", error);
      }
    });
  }

  initProfileForm(user: User): void {
    if (typeof user.area_of_interests === 'string') {
      try {
        this.areasOfInterest = JSON.parse(user.area_of_interests) as string[];
      } catch (e) {
        this.areasOfInterest = [];
      }
    } else {
      this.areasOfInterest = user.area_of_interests || [];
    }

    this.otpVerified = user.isPhoneVerified || false;

    this.profileForm.patchValue({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      ageGroup: user.ageGroup || '',
      profession: user.profession || '',
      city: user.city || '',
      company: user.company || '',
      position: user.position || '',
      aboutYou: user.about_you || '',
      agreedToTerms: user.agreed_to_terms || false,
      agreedToContribute: user.agreed_to_contribute || false
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
        this.authService.markPhoneVerified().subscribe({
          next: () => this.onSubmit(),
          error: (error) => {
            console.error('Error updating verification status:', error);
            this.toast.show('Profile saved but verification status not updated');
          }
        });
      })
      .catch((error: FirebaseError) => {
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

    this.authService.updateUserProfile(profileData).subscribe({
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

  onResendOtp(): void {
    if (this.resendCountdown > 0) {
      this.toast.show(`Please wait ${this.resendCountdown} seconds before resending OTP`, 'info');
      return;
    }
    this.sendOTP();
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


  // In the PaymentComponent class:

  checkProfileCompletion(): void {
    if (!this.user) return;

    // If profile is already marked completed in DB, use that
    if (this.user.profileCompleted) {
      this.profileCompleted = true;
      this.profileCompletionPercentage = 100;
      return;
    }

    // Otherwise calculate completion status
    const requiredFields = ['phone', 'profession', 'city', 'aboutYou', 'agreedToTerms'];
    const completedFields = requiredFields.filter(field => {
      const value = this.profileForm.get(field)?.value;
      if (field === 'agreedToTerms') return value === true;
      return value && value.toString().trim().length > 0;
    });

    this.profileCompletionPercentage = Math.round((completedFields.length / requiredFields.length) * 100);
    this.profileCompleted = this.profileCompletionPercentage === 100;
  }

  // Profile methods
  addInterest(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (value && !this.areasOfInterest.includes(value)) {
      this.areasOfInterest.push(value);
      input.value = '';
    }
    event.preventDefault();
  }

  removeInterest(interest: string): void {
    const index = this.areasOfInterest.indexOf(interest);
    if (index >= 0) {
      this.areasOfInterest.splice(index, 1);
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.toast.show("Please fill all required fields correctly", "error");
      return;
    }

    this.saving = true;
    const profileData: ProfileUpdateData = {
      phone: this.profileForm.get('phone')?.value || undefined,
      ageGroup: this.profileForm.get('ageGroup')?.value as any || undefined,
      profession: this.profileForm.get('profession')?.value || undefined,
      city: this.profileForm.get('city')?.value || undefined,
      company: this.profileForm.get('company')?.value || undefined,
      position: this.profileForm.get('position')?.value || undefined,
      area_of_interests: this.areasOfInterest.length > 0 ? this.areasOfInterest : undefined,
      about_you: this.profileForm.get('aboutYou')?.value || undefined,
      agreed_to_terms: this.profileForm.get('agreedToTerms')?.value || undefined,
      agreed_to_contribute: this.profileForm.get('agreedToContribute')?.value || undefined,
      profileCompleted: true
    };

    this.authService.updateUserProfile(profileData).subscribe({
      next: (updatedUser: User) => {
        this.user = updatedUser;
        this.saving = false;
        this.toast.show("Profile updated successfully!", "success");
        this.checkProfileCompletion();

        // Redirect based on user role
        if (this.user) {
          if (this.user.role === 'associate member') {
            // Associate members can go to dashboard after profile completion
            this.router.navigate(['/dashboard']);
          } else if (this.user.role === 'admin') {
            // Admins can go to dashboard (assuming they don't need to pay)
            this.router.navigate(['/dashboard']);
          }
          // Individual members stay on page to make payment
        }
      },
      error: (error: any) => {
        this.saving = false;
        this.toast.show("Failed to update profile. Please try again.", "error");
      }
    });
  }


  // Payment methods
  loadPresetPlans(): void {
    this.subscriptionService.getPresetPlans().subscribe({
      next: (plans: PresetPlan[]) => this.presetPlans = plans,
      error: (error: any) => console.error("Error loading preset plans:", error)
    });
  }

  loadRazorpayScript(): void {
    if (window.document.getElementById("razorpay-script")) return;
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }

  selectPresetAmount(amount: number): void {
    this.selectedAmount = amount;
    this.customAmountControl.setValue(amount.toString());
    this.validateAmount();
  }

  onCustomAmountChange(): void {
    const value = this.customAmountControl.value;
    this.selectedAmount = value && !isNaN(Number(value)) ? Number(value) : 0;
    this.validateAmount();
  }

  validateAmount(): void {
    this.isAmountValid = this.customAmountControl.valid && this.selectedAmount >= 300;
    this.showMinimumError = this.selectedAmount > 0 && this.selectedAmount < 300;
  }

  onPaymentTypeChange(type: "one-time" | "autopay"): void {
    this.paymentType = type;
  }

  isPaymentButtonEnabled(): boolean {
    return this.isAmountValid && !this.loading && !this.paymentProcessing && this.profileCompleted;
  }

  getPaymentButtonText(): string {
    if (this.loading || this.paymentProcessing) {
      return this.paymentType === "autopay" ? "Setting up AutoPay..." : "Processing Payment...";
    }
    if (!this.isAmountValid) return "Enter Valid Amount";
    if (!this.profileCompleted) return "Complete Profile First";
    return this.paymentType === "autopay"
      ? `Pay ₹${this.selectedAmount} + Setup AutoPay`
      : `Pay ₹${this.selectedAmount} (1 Month)`;
  }

  getNextChargeDate(): string {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }



  initiatePayment(): void {
    if (!this.isAmountValid) {
      this.toast.show("Please enter a valid amount (minimum ₹300)", "error");
      return;
    }
    if (!this.profileCompleted) {
      this.toast.show("Please complete your profile before making a payment", "error");
      return;
    }

    this.loading = true;
    this.paymentType === "autopay"
      ? this.setupAutoPaySubscription()
      : this.createOneTimePayment();
  }

  setupAutoPaySubscription(): void {
    this.subscriptionService.createDynamicPlan(this.selectedAmount).subscribe({
      next: (dynamicPlan: DynamicPlan) => {
        this.subscriptionService.createSubscriptionWithImmediatePayment(
          dynamicPlan.planId,
          this.selectedAmount,
          {
            customAmount: this.selectedAmount,
            paymentType: "monthly-autopay",
            contribution_reason: this.contributionReason,
          }
        ).subscribe({
          next: (subscriptionData: SubscriptionWithPayment) => {
            this.loading = false;
            this.openRazorpayCheckoutForSubscription(
              subscriptionData.firstPaymentOrder,
              subscriptionData.subscription
            );
          },
          error: (error: any) => {
            this.loading = false;
            this.toast.show("Failed to setup AutoPay. Please try again.", "error");
          }
        });
      },
      error: (error: any) => {
        this.loading = false;
        this.toast.show("Failed to create subscription plan. Please try again.", "error");
      }
    });
  }

  createOneTimePayment(): void {
    this.subscriptionService.createOneTimeOrder(
      this.selectedAmount,
      {
        customAmount: this.selectedAmount,
        paymentType: "one-time",
        contribution_reason: this.contributionReason,
      }
    ).subscribe({
      next: (order: any) => {
        this.loading = false;
        this.openRazorpayCheckout(order);
      },
      error: (error: any) => {
        this.loading = false;
        this.toast.show("Failed to initiate payment. Please try again.", "error");
      }
    });
  }

  openRazorpayCheckout(order: any): void {
    const options = {
      key: environment.razorpayKeyId,
      amount: order.amount,
      currency: order.currency,
      name: "Professionals Solidarity Forum",
      description: `1-Month Membership - ₹${this.selectedAmount}`,
      image: "/assets/images/PSF_Logo.png",
      order_id: order.id,
      handler: (response: any) => this.handleOneTimePaymentSuccess(response),
      prefill: { name: this.user?.name, email: this.user?.email },
      theme: { color: "#00796b" },
      modal: {
        ondismiss: () => this.toast.show("Payment cancelled. You can try again later.", "info")
      }
    };

    new Razorpay(options).open();
  }

  openRazorpayCheckoutForSubscription(order: any, subscription: any): void {
    const options = {
      key: environment.razorpayKeyId,
      amount: order.amount,
      currency: order.currency,
      name: "Professionals Solidarity Forum",
      description: `First Payment + AutoPay Setup - ₹${this.selectedAmount}/month`,
      image: "/assets/images/PSF_Logo.png",
      order_id: order.id,
      handler: (response: any) => this.handleSubscriptionFirstPaymentSuccess(response, subscription),
      prefill: { name: this.user?.name, email: this.user?.email },
      theme: { color: "#00796b" },
      modal: {
        ondismiss: () => this.toast.show("AutoPay setup cancelled. You can try again later.", "info")
      }
    };

    new Razorpay(options).open();
  }

  handleOneTimePaymentSuccess(response: any): void {
    this.paymentProcessing = true;
    const paymentDetails = {
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_signature: response.razorpay_signature,
    };

    this.authService.updateUserAfterPayment(paymentDetails).subscribe({
      next: () => {
        this.paymentProcessing = false;
        this.toast.show("Payment successful! Welcome to PSF (1-month membership).", "success");
        // For all roles except associate member, payment is required
        this.router.navigate(["/dashboard"]);
      },
      error: (error: any) => {
        this.paymentProcessing = false;
        this.toast.show("Payment verification failed. Please contact support.", "error");
      }
    });
  }

  handleSubscriptionFirstPaymentSuccess(response: any, subscription: any): void {
    this.paymentProcessing = true;
    const paymentDetails = {
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_signature: response.razorpay_signature,
      subscription_id: subscription.id,
    };

    this.authService.updateUserAfterPayment(paymentDetails).subscribe({
      next: () => {
        this.paymentProcessing = false;
        this.toast.show(`Payment successful! AutoPay setup complete. Next charge: ${this.getNextChargeDate()}`, "success");
        // For all roles except associate member, payment is required
        this.router.navigate(["/dashboard"]);
      },
      error: (error: any) => {
        this.paymentProcessing = false;
        this.toast.show("Payment verification failed. Please contact support.", "error");
      }
    });
  }

  formatRoleName(role: string | undefined): string {
    if (!role) return '';
    return role.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  navigateBasedOnUserStatus(): void {
    if (!this.user) return;

    if (this.user.profileCompleted) {
      if (this.user.role === 'associate member' || this.user.role === 'admin') {
        this.router.navigate(['/dashboard']);
      } else if (this.user.hasPaid) {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}