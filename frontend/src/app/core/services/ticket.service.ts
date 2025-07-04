import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, switchMap, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Ticket,
  CreateTicketRequest,
  TicketFilter,
  TicketStats,
  PaginatedTickets
} from '../models/ticket.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private apiUrl = `${environment.apiUrl}/tickets`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Helper method to format ticket dates
  private formatTicketDates(ticket: Ticket): Ticket {
    return {
      ...ticket,
      createdAt: new Date(ticket.createdAt),
      updatedAt: new Date(ticket.updatedAt),
      resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : undefined,
    };
  }

  createTicket(ticketData: CreateTicketRequest): Observable<{ message: string; ticket: Ticket }> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) =>
        this.http.post<{ message: string; ticket: Ticket }>(
          `${this.apiUrl}`,
          ticketData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
      ),
      map((response) => ({
        ...response,
        ticket: this.formatTicketDates(response.ticket),
      }))
    );
  }

  getUserTickets(filter?: TicketFilter): Observable<PaginatedTickets> {
    let params = new HttpParams();

    if (filter) {
      if (filter.status) params = params.set('status', filter.status);
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.limit) params = params.set('limit', filter.limit.toString());
    }

    return this.authService.getAccessToken().pipe(
      switchMap((token) =>
        this.http.get<PaginatedTickets>(`${this.apiUrl}/my-tickets`, {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).pipe(
          map((response) => ({
            ...response,
            tickets: response.tickets.map((ticket) => this.formatTicketDates(ticket)),
          })),
          catchError((error) => {
            console.error('Error fetching user tickets:', error);
            return throwError(() => new Error('Failed to load tickets. Please try again.'));
          })
        )
      )
    );
  }

  getAllTickets(filter?: TicketFilter): Observable<PaginatedTickets> {
    let params = new HttpParams();

    if (filter) {
      if (filter.status) params = params.set('status', filter.status);
      if (filter.priority) params = params.set('priority', filter.priority);
      if (filter.category) params = params.set('category', filter.category);
      if (filter.search) {
        params = params.set('search', filter.search);
      }
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.limit) params = params.set('limit', filter.limit.toString());
    }

    return this.authService.getAccessToken().pipe(
      switchMap((token) =>
        this.http.get<PaginatedTickets>(`${this.apiUrl}`, {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).pipe(
          map((response) => ({
            ...response,
            tickets: response.tickets.map((ticket) => ({
              ...ticket,
              userName: ticket.user?.name,  // Ensure userName is populated
              userEmail: ticket.user?.email, // Ensure userEmail is populated
            })),
          }))
        )
      )
    );
  }

  getTicketById(id: string | number): Observable<Ticket> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) =>
        this.http.get<Ticket>(`${this.apiUrl}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).pipe(
          map((ticket) => ({
            ...ticket,
            userName: ticket.user?.name, // Ensure userName is populated
            userEmail: ticket.user?.email, // Ensure userEmail is populated
            createdAt: new Date(ticket.createdAt),
            updatedAt: new Date(ticket.updatedAt),
            resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : undefined,
            responses: ticket.responses?.map((response) => ({
              ...response,
              createdAt: new Date(response.createdAt),
            })),
          })),
          catchError((error) => {
            console.error('Error fetching ticket by ID:', error);
            return throwError(() => new Error('Failed to load ticket details.'));
          })
        )
      )
    );
  }

  updateTicket(
    id: string | number,
    updateData: {
      status?: string;
      priority?: string;
      adminResponse?: string;
    }
  ): Observable<{ message: string; ticket: Ticket }> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) =>
        this.http.put<{ message: string; ticket: Ticket }>(`${this.apiUrl}/${id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` },
        }).pipe(
          map((response) => ({
            ...response,
            ticket: this.formatTicketDates(response.ticket),
          })),
          catchError((error) => {
            console.error('Error updating ticket:', error);
            return throwError(() => new Error('Failed to update ticket.'));
          })
        )
      )
    );
  }

  addTicketResponse(id: string | number, message: string): Observable<{ message: string }> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) =>
        this.http.post<{ message: string }>(
          `${this.apiUrl}/${id}/responses`,
          { message },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ).pipe(
          catchError((error) => {
            console.error('Error adding ticket response:', error);
            return throwError(() => new Error('Failed to add ticket response.'));
          })
        )
      )
    );
  }

  getTicketStats(): Observable<TicketStats> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) =>
        this.http.get<TicketStats>(`${this.apiUrl}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }).pipe(
          catchError((error) => {
            console.error('Error fetching ticket stats:', error);
            return throwError(() => new Error('Failed to fetch ticket stats.'));
          })
        )
      )
    );
  }

  deleteTicket(id: string | number): Observable<any> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) =>
        this.http.delete(`${this.apiUrl}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).pipe(
          catchError((error) => {
            console.error('Error deleting ticket:', error);
            return throwError(() => new Error('Failed to delete ticket.'));
          })
        )
      )
    );
  }
}
