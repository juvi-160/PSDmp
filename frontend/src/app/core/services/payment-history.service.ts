import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PaymentHistoryService {
  private apiUrl = `${environment.apiUrl}/payment-history/users`; // ✅ FIXED here

  constructor(private http: HttpClient) {}

  getPaymentHistory(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${userId}`).pipe(
      catchError((error) => {
        console.error('Error fetching payment history:', error);
        return throwError(() => new Error('Failed to fetch payment history. Please try again later.'));
      })
    );
  }
}
