import { Component,  OnInit } from "@angular/core"
import  { MatDialog } from "@angular/material/dialog"
import  { MatSnackBar } from "@angular/material/snack-bar"
import  { EventService } from "../../core/services/event.service"
import  { RsvpService } from "../../core/services/rsvp.service"
import  { Event } from "../../core/models/event.model"
import { ConfirmDialogComponent } from "../../admin/admin-dashboard/shared/confirm-dialog/confirm-dialog.component"
import { AuthService } from "../../core/services/auth.service"

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css'],
  standalone: false
})
export class EventsComponent implements OnInit {
  events: Event[] = []
  loading = false
  rsvpLoading = false
  error = ""
  processingEventId: number | null = null // Track which event is being processed

  constructor(
    private eventService: EventService,
    private rsvpService: RsvpService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadEvents()
  }

  loadEvents(): void {
    this.loading = true
    this.error = ""

    this.eventService.getEvents().subscribe({
      next: (events) => {
        this.events = events
        this.loading = false
      },
      error: (error) => {
        this.error = "Failed to load events. Please try again later."
        this.loading = false
        console.error("Error loading events:", error)
      },
    })
  }

  rsvpToEvent(event: Event): void {
  if (event.id == null) {
    this.snackBar.open("Invalid event", "Close", { duration: 3000 })
    return
  }
  const eventId = event.id // eventId is now always a number

  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    width: "400px",
    data: {
      title: "Confirm RSVP",
      message: `Are you sure you want to RSVP for "${event.name}" on ${this.formatDate(event.date)}?`,
    },
  })

  dialogRef.afterClosed().subscribe((result) => {
    if (result) {
      this.processingEventId = eventId
      this.rsvpLoading = true

      this.rsvpService.rsvpToEvent(eventId).subscribe({
        next: (response) => {
          this.snackBar.open("RSVP successful! The event has been added to your calendar.", "Close", {
            duration: 3000,
          })
          this.rsvpLoading = false
          this.processingEventId = null
        },
        error: (error) => {
          console.error("RSVP error:", error)
          this.snackBar.open(error.message || "Failed to RSVP. Please try again.", "Close", {
            duration: 5000,
          })
          this.rsvpLoading = false
          this.processingEventId = null
        },
      })
    }
  })
}

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  isPastEvent(date: Date | string): boolean {
    return new Date(date) < new Date()
  }

  isProcessing(eventId: number): boolean {
    return this.rsvpLoading && this.processingEventId === eventId
  }
}
