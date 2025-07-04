import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EventFeedback } from './rsvp.service';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private apiUrl = `${environment.apiUrl}/event-feedback`;  // Adjust based on your API

  constructor(private http: HttpClient) {}

  getEventFeedback(): Observable<EventFeedback[]> {
    return this.http.get<EventFeedback[]>(this.apiUrl);
  }
}
