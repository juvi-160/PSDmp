import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {
  navLinks = [
    { path: "/admin/users", label: "Users", icon: "people" },
    { path: "/admin/events", label: "Events" },
    { path: "/admin/event-rsvps", label: "Event RSVPs", icon: "how_to_reg" },
    { path: "/admin/tickets", label: "Support Tickets", icon: "support" },

    // Add more admin sections here as needed
  ]
}