import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable } from "rxjs"
import { switchMap } from "rxjs/operators"
import { environment } from "../../environments/environment"
import { AuthService } from "./auth.service"

export interface PresetPlan {
  id: number
  amount: number
  name: string
  description: string
  recommended: boolean
}

export interface DynamicPlan {
  plan: any
  planId: string
  amount: number
  amountInPaise: number
}

export interface Subscription {
  id: string
  plan_id: string
  status: string
  current_start: number
  current_end: number
  charge_at: number
  start_at: number
  end_at: number
  auth_attempts: number
  paid_count: number
  customer_notify: boolean
  notes: any
}

export interface SubscriptionWithPayment {
  firstPaymentOrder: any
  subscription: Subscription
  message: string
}

export interface OneTimeOrder {
  id: string
  amount: number
  currency: string
  receipt: string
  notes?: any
}

export interface PaymentVerification {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

@Injectable({
  providedIn: "root",
})
export class SubscriptionService {
  private apiUrl = `${environment.apiUrl}/subscription`

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  // Get preset plans/amounts
  getPresetPlans(): Observable<PresetPlan[]> {
    return this.http.get<PresetPlan[]>(`${this.apiUrl}/preset-plans`)
  }

  // Create dynamic plan for custom amount
  createDynamicPlan(amount: number): Observable<DynamicPlan> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        return this.http.post<DynamicPlan>(
          `${this.apiUrl}/create-dynamic-plan`,
          {
            amount,
            currency: "INR",
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
      }),
    )
  }

  // Create subscription with immediate first payment
  createSubscriptionWithImmediatePayment(
    planId: string,
    amount: number,
    notes: any = {},
  ): Observable<SubscriptionWithPayment> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        return this.http.post<SubscriptionWithPayment>(
          `${this.apiUrl}/create-subscription-immediate`,
          {
            planId,
            amount,
            customerNotify: true,
            notes,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
      }),
    )
  }

  // Create subscription from plan (immediate start)
  createSubscription(planId: string, notes: any = {}): Observable<Subscription> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        return this.http.post<Subscription>(
          `${this.apiUrl}/create-subscription`,
          {
            planId,
            customerNotify: true,
            notes,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
      }),
    )
  }

  // Create one-time order
  createOneTimeOrder(amount: number, notes: any = {}): Observable<OneTimeOrder> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        return this.http.post<OneTimeOrder>(
          `${this.apiUrl}/create-one-time-order`,
          {
            amount,
            currency: "INR",
            notes: {
              ...notes,
              paymentFor: "PSF One-time Membership",
              paymentType: "one-time",
              duration: "1-month",
            },
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
      }),
    )
  }

  // Verify one-time payment
  verifyOneTimePayment(paymentDetails: PaymentVerification): Observable<any> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        return this.http.post(`${this.apiUrl}/verify-payment`, paymentDetails, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }),
    )
  }

  // Verify subscription first payment
  verifySubscriptionFirstPayment(paymentDetails: PaymentVerification): Observable<any> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        return this.http.post(`${this.apiUrl}/verify-subscription-payment`, paymentDetails, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }),
    )
  }
}
