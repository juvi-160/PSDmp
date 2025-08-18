import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PaymentHistoryService {
  private baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getPaymentHistory(userEmail: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/payment-history/by-email/${userEmail}`).pipe(
      catchError((error) => throwError(() => new Error('Failed to fetch payment history')))
    );
  }

  getSubscriptionDetails(planId: string): Observable<any> {
    return this.http.get<any>(`http://localhost:3000/api/subscription/razorpay/plan/${planId}/subscriptions`).pipe(
      catchError((error) => throwError(() => new Error('Failed to fetch subscription details')))
    );
  }

  getSubscriptionById(subscriptionId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/subscription/razorpay/subscriptions/${subscriptionId}`);
  }

  getSubscriptionInvoicesById(subscriptionId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/subscription/razorpay/subscriptions/${subscriptionId}/invoices`);
  }

  enableAutoPay(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/subscription/enable-auto-pay`, {}).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  disableAutoPay(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/subscription/disable-auto-pay`, {}).pipe(
      catchError((error) => throwError(() => error))
    );
  }
}
