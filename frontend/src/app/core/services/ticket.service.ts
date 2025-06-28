import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
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
        ticket: {
          ...response.ticket,
          createdAt: new Date(response.ticket.createdAt),
          updatedAt: new Date(response.ticket.updatedAt),
          resolvedAt: response.ticket.resolvedAt ? new Date(response.ticket.resolvedAt) : undefined,
        },
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
        })
      ),
      map((response) => ({
        ...response,
        tickets: response.tickets.map((ticket) => ({
          ...ticket,
          createdAt: new Date(ticket.createdAt),
          updatedAt: new Date(ticket.updatedAt),
          resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : undefined,
        })),
      }))
    );
  }

  getAllTickets(filter?: TicketFilter): Observable<PaginatedTickets> {
    let params = new HttpParams();

    if (filter) {
      if (filter.status) params = params.set('status', filter.status);
      if (filter.priority) params = params.set('priority', filter.priority);
      if (filter.category) params = params.set('category', filter.category);
      if (filter.search) params = params.set('search', filter.search);
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
        })
      ),
      map((response) => ({
        ...response,
        tickets: response.tickets.map((ticket) => ({
          ...ticket,
          createdAt: new Date(ticket.createdAt),
          updatedAt: new Date(ticket.updatedAt),
          resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : undefined,
        })),
      }))
    );
  }

  getTicketById(id: number): Observable<Ticket> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) =>
        this.http.get<Ticket>(`${this.apiUrl}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ),
      map((ticket) => ({
        ...ticket,
        createdAt: new Date(ticket.createdAt),
        updatedAt: new Date(ticket.updatedAt),
        resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : undefined,
        responses: ticket.responses?.map((response) => ({
          ...response,
          createdAt: new Date(response.createdAt),
        })),
      }))
    );
  }

  updateTicket(
    id: number,
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
        })
      ),
      map((response) => ({
        ...response,
        ticket: {
          ...response.ticket,
          createdAt: new Date(response.ticket.createdAt),
          updatedAt: new Date(response.ticket.updatedAt),
          resolvedAt: response.ticket.resolvedAt ? new Date(response.ticket.resolvedAt) : undefined,
        },
      }))
    );
  }

  addTicketResponse(id: number, message: string): Observable<{ message: string }> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) =>
        this.http.post<{ message: string }>(
          `${this.apiUrl}/${id}/responses`,
          { message },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
      )
    );
  }

  getTicketStats(): Observable<TicketStats> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) =>
        this.http.get<TicketStats>(`${this.apiUrl}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      )
    );
  }
}
