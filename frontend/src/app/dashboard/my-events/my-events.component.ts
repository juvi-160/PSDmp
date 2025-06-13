import { Component,  OnInit } from "@angular/core"
import  { MatDialog } from "@angular/material/dialog"
import  { MatSnackBar } from "@angular/material/snack-bar"
import  { RsvpService, EventRsvp, EventStats } from "../../core/services/rsvp.service"
import { FeedbackDialogComponent } from "./feedback-dialog/feedback-dialog.component"
import { ConfirmDialogComponent } from "../../admin/admin-dashboard/shared/confirm-dialog/confirm-dialog.component"
@Component({
  selector: 'app-my-events',
  standalone: false,
  templateUrl: './my-events.component.html',
  styleUrl: './my-events.component.css'
})
export class MyEventsComponent implements OnInit {
  upcomingEvents: EventRsvp[] = []
  pastEvents: EventRsvp[] = []
  loading = false
  statsLoading = false
  error = ""
  activeTab = 0
  stats: EventStats = {
    upcoming_events: 0,
    attended_events: 0,
    cancelled_events: 0,
    missed_events: 0,
  }

  constructor(
    private rsvpService: RsvpService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadRsvps()
    this.loadStats()
  }

  loadRsvps(): void {
    this.loading = true
    this.error = ""

    this.rsvpService.getUserRsvps().subscribe({
      next: (rsvps) => {
        // Filter events into upcoming and past
        this.upcomingEvents = rsvps.filter((rsvp) => !rsvp.event.isPast && rsvp.status !== "cancelled")
        this.pastEvents = rsvps.filter((rsvp) => rsvp.event.isPast || rsvp.status === "cancelled")
        this.loading = false
      },
      error: (error) => {
        console.error("Error loading RSVPs:", error)
        this.error = "Failed to load your events. Please try again."
        this.loading = false
      },
    })
  }

  loadStats(): void {
    this.statsLoading = true

    this.rsvpService.getUserEventStats().subscribe({
      next: (stats) => {
        this.stats = stats
        this.statsLoading = false
      },
      error: (error) => {
        console.error("Error loading stats:", error)
        this.statsLoading = false
      },
    })
  }

  cancelRsvp(event: EventRsvp): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "400px",
      data: {
        title: "Cancel RSVP",
        message: `Are you sure you want to cancel your RSVP for ${event.event.name}?`,
      },
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.rsvpService.cancelRsvp(event.event.id!).subscribe({
          next: () => {
            this.snackBar.open("RSVP cancelled successfully", "Close", { duration: 3000 })
            this.loadRsvps()
            this.loadStats()
          },
          error: (error) => {
            console.error("Error cancelling RSVP:", error)
            this.snackBar.open("Failed to cancel RSVP", "Close", { duration: 3000 })
          },
        })
      }
    })
  }

  provideFeedback(event: EventRsvp): void {
    const dialogRef = this.dialog.open(FeedbackDialogComponent, {
      width: "500px",
      data: { eventName: event.event.name, eventId: event.event.id },
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadRsvps()
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

  getStatusClass(status: string): string {
    switch (status) {
      case "confirmed":
        return "status-confirmed"
      case "cancelled":
        return "status-cancelled"
      case "attended":
        return "status-attended"
      default:
        return ""
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case "confirmed":
        return "Confirmed"
      case "cancelled":
        return "Cancelled"
      case "attended":
        return "Attended"
      default:
        return status
    }
  }
}
