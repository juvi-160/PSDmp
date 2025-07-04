import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketService } from '../../../../core/services/ticket.service';
import { Ticket } from '../../../../core/models/ticket.model';

@Component({
  selector: 'app-ticket-details',
  templateUrl: './ticket-details.component.html',
  styleUrls: ['./ticket-details.component.css'],
  standalone: false,
})
export class TicketDetailsComponent implements OnInit {
  ticket: Ticket | null = null;
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketService: TicketService
  ) {}

  ngOnInit(): void {
    const ticketId = this.route.snapshot.paramMap.get('id');
    if (ticketId) {
      this.loadTicketDetails(Number(ticketId));
    } else {
      this.error = 'Ticket ID not provided';
    }
  }

  loadTicketDetails(ticketId: number): void {
    this.loading = true;
    this.error = '';
    
    this.ticketService.getTicketById(ticketId).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load ticket details';
        this.loading = false;
        console.error('Error loading ticket:', error);
      }
    });
  }

  // Format date
  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return isNaN(d.getTime())
      ? 'Invalid Date'
      : d.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  }

  // Get status class
  getStatusClass(status: string): string {
    switch (status) {
      case 'open':
        return 'status-open';
      case 'in_progress':
        return 'status-in-progress';
      case 'resolved':
        return 'status-resolved';
      case 'closed':
        return 'status-closed';
      default:
        return '';
    }
  }

  // Get priority class
  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'urgent':
        return 'priority-urgent';
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  }

  // Navigate back to ticket list
  navigateBack(): void {
    this.router.navigate(['/admin/ticket-details']);
  }
}
