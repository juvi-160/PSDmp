import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private baseUrl = '/api/rsvps';

  constructor(private http: HttpClient) {}

  getFeedbackByEventId(eventId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/events/${eventId}/feedback`);
  }
}
