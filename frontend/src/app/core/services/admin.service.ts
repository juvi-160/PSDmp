import { Injectable } from "@angular/core"
import {  HttpClient, HttpParams } from "@angular/common/http"
import  { Observable } from "rxjs"
import { map, switchMap } from "rxjs/operators"
import { environment } from "../../environments/environment"
import  { AuthService } from "./auth.service"
import  { Event } from "../models/event.model"

export interface EventRsvp {
  id: number
  eventId: number
  eventName: string
  eventDate: Date
  userId: string
  userName: string
  userEmail: string
  userPhone: string
  userRole: string
  status: "confirmed" | "cancelled" | "attended"
  feedbackProvided: boolean
  rsvpDate: Date
}

export interface EventRsvpFilter {
  eventId?: number
  status?: string
  search?: string
  role?: string
  dateFrom?: Date
  dateTo?: Date
}

export interface EventWithRsvpStats extends Event {
  rsvpStats: {
    total: number
    confirmed: number
    cancelled: number
    attended: number
  }
}

@Injectable({
  providedIn: "root",
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  // Get all event RSVPs with optional filtering
  getEventRsvps(filter?: EventRsvpFilter): Observable<EventRsvp[]> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        let params = new HttpParams()

        if (filter) {
          if (filter.eventId) params = params.set("eventId", filter.eventId.toString())
          if (filter.status) params = params.set("status", filter.status)
          if (filter.search) params = params.set("search", filter.search)
          if (filter.role) params = params.set("role", filter.role)
          if (filter.dateFrom) params = params.set("dateFrom", filter.dateFrom.toISOString())
          if (filter.dateTo) params = params.set("dateTo", filter.dateTo.toISOString())
        }

        return this.http.get<EventRsvp[]>(`${this.apiUrl}/events/rsvps`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        })
      }),
      map((rsvps) =>
        rsvps.map((rsvp) => ({
          ...rsvp,
          eventDate: new Date(rsvp.eventDate),
          rsvpDate: new Date(rsvp.rsvpDate),
        })),
      ),
    )
  }

  // Export event RSVPs to Excel
  exportEventRsvpsToExcel(filter?: EventRsvpFilter): Observable<Blob> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        let params = new HttpParams()

        if (filter) {
          if (filter.eventId) params = params.set("eventId", filter.eventId.toString())
          if (filter.status) params = params.set("status", filter.status)
          if (filter.search) params = params.set("search", filter.search)
          if (filter.role) params = params.set("role", filter.role)
          if (filter.dateFrom) params = params.set("dateFrom", filter.dateFrom.toISOString())
          if (filter.dateTo) params = params.set("dateTo", filter.dateTo.toISOString())
        }

        return this.http.get(`${this.apiUrl}/events/rsvps/export`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
          responseType: "blob",
        })
      }),
    )
  }

  // Get event RSVP statistics
  getEventRsvpStats(eventId: number): Observable<{
    confirmed_count: number
    cancelled_count: number
    attended_count: number
    total_count: number
  }> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        return this.http.get<{
          confirmed_count: number
          cancelled_count: number
          attended_count: number
          total_count: number
        }>(`${this.apiUrl}/events/${eventId}/rsvps/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }),
    )
  }

  // Update RSVP status
  updateRsvpStatus(rsvpId: number, status: "confirmed" | "cancelled" | "attended"): Observable<{ message: string }> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        return this.http.put<{ message: string }>(
          `${this.apiUrl}/events/rsvps/${rsvpId}`,
          { status },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        )
      }),
    )
  }

  // Get all events with RSVP counts
  getEventsWithRsvpCounts(): Observable<EventWithRsvpStats[]> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        return this.http.get<EventWithRsvpStats[]>(`${this.apiUrl}/events/with-rsvp-counts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }),
      map((events) =>
  events.map((event) => ({
    ...event,
    date: new Date(event.date),
    createdAt: event.createdAt ? new Date(event.createdAt) : undefined,
    updatedAt: event.updatedAt ? new Date(event.updatedAt) : undefined,
  })),
      ),
    )
  }
}
