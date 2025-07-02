import { Component,  OnInit, ViewChild } from "@angular/core"
import { MatTableDataSource } from "@angular/material/table"
import { MatPaginator } from "@angular/material/paginator"
import { MatSort } from "@angular/material/sort"
import  { MatDialog } from "@angular/material/dialog"
import  { MatSnackBar } from "@angular/material/snack-bar"
import  { Router } from "@angular/router"
import { EventService } from "../../../../core/services/event.service"
import { Event } from "../../../../core/models/event.model"
import { ConfirmDialogComponent } from "../../shared/confirm-dialog/confirm-dialog.component"
import { ToastService } from "../../../../core/services/toast.service";
@Component({
  selector: 'app-event-list',
  standalone: false,
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.css'
})
export class EventListComponent implements OnInit {
  displayedColumns: string[] = ["name", "date", "image", "actions"]
  dataSource = new MatTableDataSource<Event>([])
  loading = false
  error = ""

  @ViewChild(MatPaginator) paginator!: MatPaginator
  @ViewChild(MatSort) sort!: MatSort

  constructor(
    private eventService: EventService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadEvents()
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator
    this.dataSource.sort = this.sort
  }

  loadEvents(): void {
    this.loading = true
    this.eventService.getEvents().subscribe({
      next: (events) => {
        this.dataSource.data = events
        this.loading = false
      },
      error: (error) => {
        this.error = "Failed to load events"
        this.loading = false
        this.toast.show(this.error, "error");
      },
    })
  }
  applyFilter(event: KeyboardEvent): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  addEvent(): void {
    this.router.navigate(["/admin/events/add"])
  }

  editEvent(event: Event): void {
    this.router.navigate(["/admin/events/edit", event.id])
  }

  deleteEvent(event: Event): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "400px",
      data: {
        title: "Confirm Delete",
        message: `Are you sure you want to delete the event "${event.name}"?`,
      },
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result && event.id) {
        this.eventService.deleteEvent(event.id).subscribe({
          next: () => {
            this.toast.show("Event deleted successfully", "success");
            this.loadEvents()
          },
          error: (error) => {
            // this.snackBar.open("Failed to delete event", "Close", {
            //   duration: 5000,
            // })
            this.toast.show("Failed to delete event", "error");

          },
        })
      }
    })
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString()
  }
}
