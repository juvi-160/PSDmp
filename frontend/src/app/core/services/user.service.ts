import { Injectable } from "@angular/core"
import {  HttpClient, HttpParams } from "@angular/common/http"
import  { Observable } from "rxjs"
import { map } from "rxjs/operators"
import { environment } from "../../environments/environment"
import  { User, UserFilter, PaymentHistory } from "../models/user.model"

@Injectable({
  providedIn: "root",
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/admin/users`

  constructor(private http: HttpClient) {}

  // Get all users with optional filtering
  getUsers(filter?: UserFilter): Observable<User[]> {
    let params = new HttpParams()

    if (filter) {
      if (filter.search) params = params.set("search", filter.search)
      if (filter.role) params = params.set("role", filter.role)
      if (filter.paymentStatus !== undefined) params = params.set("hasPaid", filter.paymentStatus.toString())
      if (filter.dateFrom) params = params.set("dateFrom", filter.dateFrom.toISOString())
      if (filter.dateTo) params = params.set("dateTo", filter.dateTo.toISOString())
    }

    return this.http.get<User[]>(this.apiUrl, { params }).pipe(
      map((users) =>
        users.map((user) => ({
          ...user,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
          paymentDetails: user.paymentDetails
            ? {
                ...user.paymentDetails,
                amount: Number(user.paymentDetails.amount),
                paymentDate: user.paymentDetails.paymentDate ? new Date(user.paymentDetails.paymentDate) : undefined,
              }
            : undefined,
          paymentHistory: user.paymentHistory
            ? user.paymentHistory.map((payment) => ({
                ...payment,
                paymentDate: new Date(payment.paymentDate),
                amount: Number(payment.amount),
              }))
            : [],
        })),
      ),
    )
  }

  // Get user by ID
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`).pipe(
      map((user) => ({
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
        paymentDetails: user.paymentDetails
          ? {
              ...user.paymentDetails,
              amount: Number(user.paymentDetails.amount),
              paymentDate: user.paymentDetails.paymentDate ? new Date(user.paymentDetails.paymentDate) : undefined,
            }
          : undefined,
        paymentHistory: user.paymentHistory
          ? user.paymentHistory.map((payment) => ({
              ...payment,
              paymentDate: new Date(payment.paymentDate),
              amount: Number(payment.amount),
            }))
          : [],
      })),
    )
  }

  // Get user payment history
  getUserPaymentHistory(id: number): Observable<PaymentHistory[]> {
    return this.http.get<PaymentHistory[]>(`${this.apiUrl}/${id}/payment-history`).pipe(
      map((payments) =>
        payments.map((payment) => ({
          ...payment,
          paymentDate: new Date(payment.paymentDate),
          amount: Number(payment.amount),
        })),
      ),
    )
  }

  // Update user
  updateUser(id: number, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, userData)
  }

  // Export users to Excel
  exportUsersToExcel(filter?: UserFilter): Observable<Blob> {
    let params = new HttpParams()

    if (filter) {
      if (filter.search) params = params.set("search", filter.search)
      if (filter.role) params = params.set("role", filter.role)
      if (filter.paymentStatus !== undefined) params = params.set("hasPaid", filter.paymentStatus.toString())
      if (filter.dateFrom) params = params.set("dateFrom", filter.dateFrom.toISOString())
      if (filter.dateTo) params = params.set("dateTo", filter.dateTo.toISOString())
    }

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: "blob",
    })
  }

  // Get user statistics
  getUserStats(): Observable<{
    totalUsers: number
    paidUsers: number
    pendingUsers: number
    totalRevenue: number
  }> {
    return this.http.get<{
      totalUsers: number
      paidUsers: number
      pendingUsers: number
      totalRevenue: number
    }>(`${this.apiUrl}/stats`)
  }

  // Update user role
  updateUserRole(id: number, role: string): Observable<{ user: User, emailSent: boolean }> {
  return this.http.put<{ user: User, emailSent: boolean }>(`${this.apiUrl}/${id}/role`, { role }).pipe(
    map((response) => ({
      user: {
        ...response.user,
        createdAt: new Date(response.user.createdAt),
        updatedAt: new Date(response.user.updatedAt),
        paymentDetails: response.user.paymentDetails
          ? {
              ...response.user.paymentDetails,
              amount: Number(response.user.paymentDetails.amount),
              paymentDate: response.user.paymentDetails.paymentDate ? new Date(response.user.paymentDetails.paymentDate) : undefined,
            }
          : undefined,
      },
      emailSent: response.emailSent
    }))
  );
}


  // Delete user
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
  }
}
