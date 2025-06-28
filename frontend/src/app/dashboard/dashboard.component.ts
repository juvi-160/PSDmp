import { Component, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: false
})
export class DashboardComponent implements OnInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  isAdmin = false; // ADDED ADMIN FLAG

  navItems = [
    { icon: 'dashboard', label: 'Dashboard', link: '/dashboard' },
    { icon: 'newspaper', label: 'Events', link: '/dashboard/event' },
    { icon: 'event_note', label: 'My Events', link: '/dashboard/my-events' },
    { icon: 'support', label: 'Raise Query/Ticket', link: '/dashboard/raise-ticket' },
    { icon: 'confirmation_number', label: 'My Tickets', link: '/dashboard/my-tickets' },
    { icon: 'account_circle', label: 'Profile', link: '/dashboard/profile' },
    { icon: 'money', label: 'Payment History', link: '/dashboard/history' },
  ];

  constructor(
    private router: Router,
    public auth: AuthService
  ) {}

  // ADDED ngOnInit FOR ADMIN CHECK
  ngOnInit(): void {
    this.auth.user$.subscribe((user: any) => {
      // Check for admin role in user's app_metadata or user_metadata
      this.isAdmin = user?.['https://your-namespace/roles']?.includes('admin') || 
                    user?.app_metadata?.roles?.includes('admin') ||
                    user?.user_metadata?.role === 'admin';
    });
  }

  toggleSidenav() {
    this.sidenav.toggle();
  }

  logout() {
    this.auth.logout({ 
      logoutParams: { 
        returnTo: window.location.origin 
      } 
    });
  }
}