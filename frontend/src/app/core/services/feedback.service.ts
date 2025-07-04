import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EventFeedback } from './rsvp.service';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private apiUrl = `${environment.apiUrl}/events`;  // Adjust the base API URL

  constructor(private http: HttpClient) {}

  // Get feedback for a specific event
  getEventFeedback(eventId: number): Observable<EventFeedback[]> {
    return this.http.get<EventFeedback[]>(`${this.apiUrl}/${eventId}/feedback`);
  }
}
