import { Injectable } from "@angular/core"
import {  HttpClient,  HttpErrorResponse, HttpHeaders } from "@angular/common/http"
import {  Observable, throwError } from "rxjs"
import { catchError, tap, map, switchMap } from "rxjs/operators"
import { environment } from "../../environments/environment"
import  { Event } from "../models/event.model"
import  { AuthService } from "./auth.service"

export interface EventRsvp {
  rsvpId: number
  status: "confirmed" | "cancelled" | "attended"
  feedbackProvided: boolean
  rsvpDate: Date
  event: Event & {
    isPast: boolean
  }
}

export interface EventStats {
  upcoming_events: number
  attended_events: number
  cancelled_events: number
  missed_events: number
}

export interface EventFeedback {
  eventId: number
  rating: number
  comments?: string
}

@Injectable({
  providedIn: "root",
})
export class RsvpService {
  private apiUrl = `${environment.apiUrl}/rsvps`

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

    getFeedbackForEvent(eventId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/events/${eventId}/feedback`);
  }

  // Helper method to get auth headers
  private getAuthHeaders(): Observable<HttpHeaders> {
    return this.authService.getAccessToken().pipe(
      tap((token) => console.log("Token obtained for RSVP request:", token.substring(0, 20) + "...")),
      catchError((error) => {
        console.error("Error getting access token:", error)
        return throwError(() => new Error("Failed to get authentication token"))
      }),
      map(
        (token) =>
          new HttpHeaders({
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }),
      ),
    )
  }

  // RSVP to an event
  rsvpToEvent(eventId: number): Observable<{ message: string }> {
    console.log(`Sending RSVP request for event ${eventId}`)

    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        console.log("Using token for RSVP:", token.substring(0, 20) + "...")

        return this.http
          .post<{ message: string }>(
            `${this.apiUrl}/events/${eventId}/rsvp`,
            {},
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          )
          .pipe(
            tap((response) => console.log("RSVP response:", response)),
            catchError(this.handleError),
          )
      }),
    )
  }

  // Cancel RSVP
  cancelRsvp(eventId: number): Observable<{ message: string }> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        return this.http
          .put<{ message: string }>(
            `${this.apiUrl}/events/${eventId}/cancel`,
            {},
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          )
          .pipe(
            tap((response) => console.log("Cancel RSVP response:", response)),
            catchError(this.handleError),
          )
      }),
    )
  }

  // Get user's RSVPs
  getUserRsvps(): Observable<EventRsvp[]> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        console.log("Using token for getUserRsvps:", token.substring(0, 20) + "...")

        return this.http
          .get<EventRsvp[]>(`${this.apiUrl}/my-events`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
          .pipe(
            tap((response) => console.log("Get RSVPs response:", response.length, "items")),
            catchError(this.handleError),
          )
      }),
    )
  }

  // Get user's event statistics
  getUserEventStats(): Observable<EventStats> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        return this.http
          .get<EventStats>(`${this.apiUrl}/stats`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
          .pipe(
            tap((response) => console.log("Get stats response:", response)),
            catchError(this.handleError),
          )
      }),
    )
  }

  // Submit feedback
  submitFeedback(eventId: number, feedback: EventFeedback): Observable<{ message: string }> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        return this.http
          .post<{ message: string }>(`${this.apiUrl}/events/${eventId}/feedback`, feedback, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
          .pipe(
            tap((response) => console.log("Submit feedback response:", response)),
            catchError(this.handleError),
          )
      }),
    )
  }

  // Error handling
  private handleError(error: HttpErrorResponse) {
    console.error("API Error:", error)

    // Log more details about the error
    if (error.error) {
      console.error("Error details:", error.error)
    }

    let errorMessage = "An unknown error occurred"
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.error?.message || error.message}`

      if (error.status === 401) {
        errorMessage = "Authentication error. Please try logging in again."
      }
    }

    return throwError(() => new Error(errorMessage))
  }
}
