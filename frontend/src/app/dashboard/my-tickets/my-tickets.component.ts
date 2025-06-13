import { Component,  OnInit, ViewChild } from "@angular/core"
import { MatTableDataSource } from "@angular/material/table"
import { MatPaginator } from "@angular/material/paginator"
import { MatSort } from "@angular/material/sort"
import  { MatDialog } from "@angular/material/dialog"
import  { Router } from "@angular/router"
import  { TicketService } from "../../core/services/ticket.service"
import  { Ticket, TicketFilter } from "../../core/models/ticket.model"

@Component({
  selector: 'app-my-tickets',
  standalone: false,
  templateUrl: './my-tickets.component.html',
  styleUrl: './my-tickets.component.css'
})
export class MyTicketsComponent implements OnInit {
  displayedColumns: string[] = ["id", "subject", "category", "priority", "status", "createdAt", "actions"]

  dataSource = new MatTableDataSource<Ticket>([])
  loading = false
  error = ""

  statusFilter = ""
  totalTickets = 0
  currentPage = 1
  pageSize = 10

  @ViewChild(MatPaginator) paginator!: MatPaginator
  @ViewChild(MatSort) sort!: MatSort

  constructor(
    private ticketService: TicketService,
    private dialog: MatDialog,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadTickets()
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator
    this.dataSource.sort = this.sort
  }

  loadTickets(): void {
    this.loading = true
    this.error = ""

    const filter: TicketFilter = {
      status: this.statusFilter || undefined,
      page: this.currentPage,
      limit: this.pageSize,
    }

    this.ticketService.getUserTickets(filter).subscribe({
      next: (response) => {
        this.dataSource.data = response.tickets
        this.totalTickets = response.pagination.total
        this.loading = false
      },
      error: (error) => {
        this.error = "Failed to load tickets. Please try again."
        this.loading = false
        console.error("Error loading tickets:", error)
      },
    })
  }

  applyStatusFilter(): void {
    this.currentPage = 1
    this.loadTickets()
  }

  resetFilter(): void {
    this.statusFilter = ""
    this.currentPage = 1
    this.loadTickets()
  }

  viewTicket(ticket: Ticket): void {
    this.router.navigate(["/dashboard/ticket-details", ticket.id])
  }

  raiseNewTicket(): void {
    this.router.navigate(["/dashboard/raise-ticket"])
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString()
  }

  getStatusClass(status: string): string {
    switch (status) {
      case "open":
        return "status-open"
      case "in_progress":
        return "status-in-progress"
      case "resolved":
        return "status-resolved"
      case "closed":
        return "status-closed"
      default:
        return ""
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case "urgent":
        return "priority-urgent"
      case "high":
        return "priority-high"
      case "medium":
        return "priority-medium"
      case "low":
        return "priority-low"
      default:
        return ""
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case "payment":
        return "payment"
      case "technical":
        return "build"
      case "membership":
        return "card_membership"
      case "events":
        return "event"
      case "general":
        return "help_outline"
      default:
        return "help_outline"
    }
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1
    this.pageSize = event.pageSize
    this.loadTickets()
  }
}

