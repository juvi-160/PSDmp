import { Component,  OnInit, ViewChild } from "@angular/core"
import  { FormBuilder, FormGroup } from "@angular/forms"
import { MatTableDataSource } from "@angular/material/table"
import { MatPaginator } from "@angular/material/paginator"
import { MatSort } from "@angular/material/sort"
import  { MatDialog } from "@angular/material/dialog"
import  { MatSnackBar } from "@angular/material/snack-bar"
import  { AdminService, EventRsvp, EventRsvpFilter } from "../../core/services/admin.service"
import  { EventService } from "../../core/services/event.service"
import  { Event } from "../../core/models/event.model"
import { ConfirmDialogComponent } from "../admin-dashboard/shared/confirm-dialog/confirm-dialog.component"
import { ToastService } from "../../core/services/toast.service"

@Component({
  selector: 'app-event-rsvps',
  standalone: false,
  templateUrl: './event-rsvps.component.html',
  styleUrl: './event-rsvps.component.css'
})
export class EventRsvpsComponent implements OnInit {
  displayedColumns: string[] = [
    "id",
    "eventName",
    "eventDate",
    "userName",
    "userEmail",
    "userPhone",
    "userRole",
    "status",
    "rsvpDate",
    "actions",
  ]
  dataSource = new MatTableDataSource<EventRsvp>([])
  filterForm: FormGroup
  loading = false
  error = ""
  events: Event[] = []

  @ViewChild(MatPaginator) paginator!: MatPaginator
  @ViewChild(MatSort) sort!: MatSort

  constructor(
    private adminService: AdminService,
    private eventService: EventService,
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private toast: ToastService
  ) {
    this.filterForm = this.formBuilder.group({
      eventId: [""],
      status: [""],
      search: [""],
      role: [""],
      dateFrom: [null],
      dateTo: [null],
    })
  }

  ngOnInit(): void {
    this.loadEvents()
    this.loadRsvps()
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator
    this.dataSource.sort = this.sort
  }

  loadEvents(): void {
    this.eventService.getEvents().subscribe({
      next: (events) => {
        this.events = events
      },
      error: (error) => {
        console.error("Error loading events:", error)
        this.toast.show("Failed to load events", "error")
      },
    })
  }

  loadRsvps(): void {
    this.loading = true
    this.error = ""

    const filter: EventRsvpFilter = {
      eventId: this.filterForm.get("eventId")?.value || undefined,
      status: this.filterForm.get("status")?.value || undefined,
      search: this.filterForm.get("search")?.value || undefined,
      role: this.filterForm.get("role")?.value || undefined,
      dateFrom: this.filterForm.get("dateFrom")?.value || undefined,
      dateTo: this.filterForm.get("dateTo")?.value || undefined,
    }

    this.adminService.getEventRsvps(filter).subscribe({
      next: (rsvps) => {
        this.dataSource.data = rsvps
        this.loading = false
      },
      error: (error) => {
        this.error = "Failed to load RSVPs. Please try again."
        this.loading = false
        console.error("Error loading RSVPs:", error)
      },
    })
  }

  applyFilter(): void {
    this.loadRsvps()
  }

  resetFilter(): void {
    this.filterForm.reset({
      eventId: "",
      status: "",
      search: "",
      role: "",
      dateFrom: null,
      dateTo: null,
    })
    this.loadRsvps()
  }

  exportToExcel(): void {
    this.loading = true

    const filter: EventRsvpFilter = {
      eventId: this.filterForm.get("eventId")?.value || undefined,
      status: this.filterForm.get("status")?.value || undefined,
      search: this.filterForm.get("search")?.value || undefined,
      role: this.filterForm.get("role")?.value || undefined,
      dateFrom: this.filterForm.get("dateFrom")?.value || undefined,
      dateTo: this.filterForm.get("dateTo")?.value || undefined,
    }

    this.adminService.exportEventRsvpsToExcel(filter).subscribe({
      next: (blob) => {
        this.loading = false

        // Create a download link and trigger download
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `event_rsvps_${new Date().toISOString().split("T")[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        this.toast.show("Export successful", "success")
      },
      error: (error) => {
        this.loading = false
        console.error("Error exporting RSVPs:", error)
        this.toast.show("Failed to export RSVPs", "error")
      },
    })
  }

  updateStatus(rsvp: EventRsvp, newStatus: "confirmed" | "cancelled" | "attended"): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "400px",
      data: {
        title: "Confirm Status Change",
        message: `Are you sure you want to change the status of ${rsvp.userName}'s RSVP to ${newStatus}?`,
      },
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.adminService.updateRsvpStatus(rsvp.id, newStatus).subscribe({
          next: () => {
            this.toast.show("RSVP status updated successfully", "success")
            this.loadRsvps()
          },
          error: (error) => {
            console.error("Error updating RSVP status:", error)
            this.toast.show("Failed to update RSVP status", "error")
          },
        })
      }
    })
  }

 formatDate(date: Date | string): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString()
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

  getRoleClass(role: string): string {
    switch (role) {
      case "admin":
        return "role-admin"
      case "individual member":
        return "role-member"
      case "pending":
        return "role-pending"
      default:
        return ""
    }
  }
}
