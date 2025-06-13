import { Component,  OnInit } from "@angular/core"
import  { Router } from "@angular/router"
import  { MatSnackBar } from "@angular/material/snack-bar"
import { FormControl, Validators } from "@angular/forms"
import  {
  SubscriptionService,
  PresetPlan,
  DynamicPlan,
  SubscriptionWithPayment,
} from "../core/services/subscription.service"
import  { AuthService } from "../core/services/auth.service"
import { environment } from "../environments/environment"

declare var Razorpay: any

@Component({
  selector: 'app-payment',
  standalone: false,
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent implements OnInit {
  loading = false
  paymentProcessing = false
  userName = ""
  userEmail = ""

  // Form controls
  customAmountControl = new FormControl("", [Validators.required, Validators.min(300), Validators.pattern(/^\d+$/)])

  // Payment data
  selectedAmount = 0
  presetPlans: PresetPlan[] = []
  paymentType: "one-time" | "autopay" = "one-time"

  // Validation states
  isAmountValid = false
  showMinimumError = false

  constructor(
    private subscriptionService: SubscriptionService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    // Check if user is already logged in and has paid
    this.authService.checkPaymentStatus().subscribe({
      next: (hasPaid) => {
        if (hasPaid) {
          this.router.navigate(["/dashboard"])
          return
        }
      },
      error: (error) => {
        console.error("Error checking payment status:", error)
      },
    })

    // Get user details
    this.authService.currentUser.subscribe((user) => {
      if (user) {
        this.userName = user.name
        this.userEmail = user.email
      } else {
        this.router.navigate(["/"])
      }
    })

    // Load preset plans
    this.loadPresetPlans()

    // Load Razorpay script
    this.loadRazorpayScript()
  }

  loadPresetPlans(): void {
    this.subscriptionService.getPresetPlans().subscribe({
      next: (plans) => {
        this.presetPlans = plans
      },
      error: (error) => {
        console.error("Error loading preset plans:", error)
      },
    })
  }

  loadRazorpayScript(): void {
    if (window.document.getElementById("razorpay-script")) {
      return
    }

    const script = document.createElement("script")
    script.id = "razorpay-script"
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.defer = true
    document.body.appendChild(script)
  }

  // Select preset amount
  selectPresetAmount(amount: number): void {
    this.selectedAmount = amount
    this.customAmountControl.setValue(amount.toString())
    this.validateAmount()
  }

  // Handle custom amount input
  onCustomAmountChange(): void {
    const value = this.customAmountControl.value
    if (value && !isNaN(Number(value))) {
      this.selectedAmount = Number(value)
    } else {
      this.selectedAmount = 0
    }
    this.validateAmount()
  }

  // Validate amount
  validateAmount(): void {
    this.isAmountValid = this.customAmountControl.valid && this.selectedAmount >= 300
    this.showMinimumError = this.selectedAmount > 0 && this.selectedAmount < 300
  }

  // Toggle payment type
  onPaymentTypeChange(type: "one-time" | "autopay"): void {
    this.paymentType = type
  }

  // Check if payment button should be enabled
  isPaymentButtonEnabled(): boolean {
    return this.isAmountValid && !this.loading && !this.paymentProcessing
  }

  // Get payment button text
  getPaymentButtonText(): string {
    if (this.loading || this.paymentProcessing) {
      return this.paymentType === "autopay" ? "Setting up AutoPay..." : "Processing Payment..."
    }

    if (!this.isAmountValid) {
      return "Enter Valid Amount"
    }

    if (this.paymentType === "autopay") {
      return `Pay ₹${this.selectedAmount} + Setup AutoPay`
    } else {
      return `Pay ₹${this.selectedAmount} (1 Month)`
    }
  }

  // Get selected preset plan
  getSelectedPresetPlan(): PresetPlan | null {
    return this.presetPlans.find((plan) => plan.amount === this.selectedAmount) || null
  }

  // Get next charge date
  getNextChargeDate(): string {
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

    return nextMonth.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Initiate payment
  initiatePayment(): void {
    if (!this.isAmountValid) {
      this.snackBar.open("Please enter a valid amount (minimum ₹300)", "Close", { duration: 5000 })
      return
    }

    this.loading = true

    if (this.paymentType === "autopay") {
      this.setupAutoPaySubscription()
    } else {
      this.createOneTimePayment()
    }
  }

  // Setup AutoPay subscription with immediate first payment
  setupAutoPaySubscription(): void {
    // First create dynamic plan
    this.subscriptionService.createDynamicPlan(this.selectedAmount).subscribe({
      next: (dynamicPlan: DynamicPlan) => {
        // Then create subscription with immediate first payment
        this.subscriptionService
          .createSubscriptionWithImmediatePayment(dynamicPlan.planId, this.selectedAmount, {
            customAmount: this.selectedAmount,
            paymentType: "monthly-autopay",
          })
          .subscribe({
            next: (subscriptionData: SubscriptionWithPayment) => {
              this.loading = false
              // Open Razorpay checkout for immediate first payment
              this.openRazorpayCheckoutForSubscription(
                subscriptionData.firstPaymentOrder,
                subscriptionData.subscription,
              )
            },
            error: (error) => {
              this.loading = false
              console.error("Error creating subscription:", error)
              this.snackBar.open("Failed to setup AutoPay. Please try again.", "Close", { duration: 5000 })
            },
          })
      },
      error: (error) => {
        this.loading = false
        console.error("Error creating dynamic plan:", error)
        this.snackBar.open("Failed to create subscription plan. Please try again.", "Close", { duration: 5000 })
      },
    })
  }

  // Create one-time payment
  createOneTimePayment(): void {
    this.subscriptionService
      .createOneTimeOrder(this.selectedAmount, {
        customAmount: this.selectedAmount,
        paymentType: "one-time",
      })
      .subscribe({
        next: (order) => {
          this.loading = false
          this.openRazorpayCheckout(order)
        },
        error: (error) => {
          this.loading = false
          console.error("Error creating one-time order:", error)
          this.snackBar.open("Failed to initiate payment. Please try again.", "Close", { duration: 5000 })
        },
      })
  }

  // Open Razorpay checkout for one-time payment
  openRazorpayCheckout(order: any): void {
    const options = {
      key: environment.razorpayKeyId,
      amount: order.amount,
      currency: order.currency,
      name: "Professionals Solidarity Forum",
      description: `1-Month Membership - ₹${this.selectedAmount}`,
      image: "/assets/images/PSF_Logo.png",
      order_id: order.id,
      handler: (response: any) => {
        this.handleOneTimePaymentSuccess(response)
      },
      prefill: {
        name: this.userName,
        email: this.userEmail,
      },
      theme: {
        color: "#00796b",
      },
      modal: {
        ondismiss: () => {
          this.snackBar.open("Payment cancelled. You can try again later.", "Close", { duration: 5000 })
        },
      },
    }

    const razorpayWindow = new Razorpay(options)
    razorpayWindow.open()
  }

  // Open Razorpay checkout for subscription first payment
  openRazorpayCheckoutForSubscription(order: any, subscription: any): void {
    const options = {
      key: environment.razorpayKeyId,
      amount: order.amount,
      currency: order.currency,
      name: "Professionals Solidarity Forum",
      description: `First Payment + AutoPay Setup - ₹${this.selectedAmount}/month`,
      image: "/assets/images/PSF_Logo.png",
      order_id: order.id,
      handler: (response: any) => {
        this.handleSubscriptionFirstPaymentSuccess(response, subscription)
      },
      prefill: {
        name: this.userName,
        email: this.userEmail,
      },
      theme: {
        color: "#00796b",
      },
      modal: {
        ondismiss: () => {
          this.snackBar.open("AutoPay setup cancelled. You can try again later.", "Close", { duration: 5000 })
        },
      },
    }

    const razorpayWindow = new Razorpay(options)
    razorpayWindow.open()
  }

  // Handle one-time payment success
  handleOneTimePaymentSuccess(response: any): void {
    this.paymentProcessing = true

    const paymentDetails = {
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_signature: response.razorpay_signature,
    }

    this.subscriptionService.verifyOneTimePayment(paymentDetails).subscribe({
      next: (result) => {
        this.paymentProcessing = false
        this.snackBar.open("Payment successful! Welcome to PSF (1-month membership).", "Close", { duration: 5000 })
        this.router.navigate(["/dashboard"])
      },
      error: (error) => {
        this.paymentProcessing = false
        console.error("Payment verification failed:", error)
        this.snackBar.open("Payment verification failed. Please contact support.", "Close", { duration: 5000 })
      },
    })
  }

  // Handle subscription first payment success
  handleSubscriptionFirstPaymentSuccess(response: any, subscription: any): void {
    this.paymentProcessing = true

    const paymentDetails = {
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_signature: response.razorpay_signature,
    }

    this.subscriptionService.verifySubscriptionFirstPayment(paymentDetails).subscribe({
      next: (result) => {
        this.paymentProcessing = false
        this.snackBar.open(
          `Payment successful! AutoPay setup complete. Next charge: ${this.getNextChargeDate()}`,
          "Close",
          { duration: 7000 },
        )
        this.router.navigate(["/dashboard"])
      },
      error: (error) => {
        this.paymentProcessing = false
        console.error("Payment verification failed:", error)
        this.snackBar.open("Payment verification failed. Please contact support.", "Close", { duration: 5000 })
      },
    })
  }
}