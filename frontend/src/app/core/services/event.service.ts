import { Injectable } from "@angular/core"
import  { HttpClient } from "@angular/common/http"
import  { Observable } from "rxjs"
import { environment } from "../../environments/environment"
import  { Event } from "../models/event.model"

@Injectable({
  providedIn: "root",
})
export class EventService {
  private apiUrl = `${environment.apiUrl}/events`

  constructor(private http: HttpClient) {}

  // Get all events
  getEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.apiUrl)
  }

  // Get event by ID
  getEvent(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`)
  }

  // Create new event
  createEvent(event: Event, imageFile?: File): Observable<Event> {
    const formData = new FormData()

    // Append event data
    formData.append("name", event.name)
    formData.append("description", event.description)
    formData.append("date", new Date(event.date).toISOString())

    // Append image if available
    if (imageFile) {
      formData.append("image", imageFile)
    }

    return this.http.post<Event>(this.apiUrl, formData)
  }

  // Update existing event
  updateEvent(id: number, event: Event, imageFile?: File): Observable<Event> {
    const formData = new FormData()

    // Append event data
    formData.append("name", event.name)
    formData.append("description", event.description)
    formData.append("date", new Date(event.date).toISOString())

    // Append image if available
    if (imageFile) {
      formData.append("image", imageFile)
    }

    return this.http.put<Event>(`${this.apiUrl}/${id}`, formData)
  }

  // Delete event
  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
  }
}
