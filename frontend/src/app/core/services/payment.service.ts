import { Injectable } from "@angular/core"
import  { HttpClient } from "@angular/common/http"
import  { Observable } from "rxjs"
import { switchMap } from "rxjs/operators"
import { environment } from "../../environments/environment"
import  { AuthService } from "./auth.service"

export interface PaymentOrder {
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
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payment`

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  // Create a new payment order
  createOrder(): Observable<PaymentOrder> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        return this.http.post<PaymentOrder>(
          `${this.apiUrl}/create-order`,
          {
            amount: environment.membershipFee, // Amount in paise (e.g., 100000 for ₹1000)
            currency: "INR",
            receipt: `receipt_${new Date().getTime()}`,
            notes: {
              paymentFor: "PSF Membership",
            },
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
      }),
    )
  }

  // Verify payment after successful transaction
  verifyPayment(paymentDetails: PaymentVerification): Observable<any> {
    return this.authService.updateUserAfterPayment(paymentDetails)
  }
}
