import { Component } from '@angular/core';
import { Inject } from '@angular/core';
// Import your AuthService (adjust the path as needed)
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {
  navLinks = [
    { path: "/admin/users", label: "Users", icon: "people" },
    { path: "/admin/events", label: "Events",icon:"event" },
    { path: "/admin/event-rsvps", label: "Event RSVPs", icon: "how_to_reg" },
    { path: "/admin/tickets", label: "Support Tickets", icon: "support" },
    { path: "/admin/feedback", label: "Event Feedback", icon: "chat" },
    // { path: "/admin/invite", label: "Invite Members", icon: "drafts" },
    // Add more admin sections here as needed
  ]

  constructor(public auth: AuthService) {}

  logout(): void {
    this.auth.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  }
}