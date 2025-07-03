import { Component, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { AuthService } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: false
})
export class DashboardComponent implements OnInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  isAdmin = false;
  isAssociateMember = false; // For checking if the user is an associate member
  navItems: { icon: string, label: string, link: string }[] = [];

  constructor(
    private router: Router,
    public auth: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.auth.user$.subscribe((user: any) => {
      if (!user?.email) return;

      const email = user.email;

      // Fetch the user's role based on the email
      this.http.get<any>(`${environment.apiUrl}/admin/check-user-role/${email}`).subscribe({
        next: (roleData) => {
          // Check if the user is an admin or associate member based on the role
          this.isAdmin = roleData.role === 'admin';  // Set isAdmin based on the role
          this.isAssociateMember = roleData.role === 'associate member'; // Associate member check

          localStorage.setItem('isAdmin', JSON.stringify(this.isAdmin));  // Store isAdmin in localStorage
          localStorage.setItem('isAssociateMember', JSON.stringify(this.isAssociateMember)); // Store associate member status

          // Set navigation items
          this.navItems = [
            { icon: 'dashboard', label: 'Dashboard', link: '/dashboard' },
            ...(this.isAssociateMember ? [{ icon: 'money', label: 'Contribute', link: '/dashboard/contribute' }] : []),
            { icon: 'newspaper', label: 'Events', link: '/dashboard/event' },
            { icon: 'event_note', label: 'My Events', link: '/dashboard/my-events' },
            { icon: 'support', label: 'Raise Query/Ticket', link: '/dashboard/raise-ticket' },
            { icon: 'confirmation_number', label: 'My Tickets', link: '/dashboard/my-tickets' },
            { icon: 'account_circle', label: 'Profile', link: '/dashboard/profile' },
            { icon: 'money', label: 'Payment History', link: `/dashboard/payment-history/${email}` },
          ];

        },
        error: (err) => {
          console.error('Failed to fetch user role:', err);
        }
      });

      // Retrieve admin and associate member status from localStorage (in case of page reload)
      const storedIsAdmin = JSON.parse(localStorage.getItem('isAdmin') || 'false');
      const storedIsAssociateMember = JSON.parse(localStorage.getItem('isAssociateMember') || 'false');
      this.isAdmin = storedIsAdmin;
      this.isAssociateMember = storedIsAssociateMember;
    });
  }

  toggleSidenav(): void {
    this.sidenav.toggle();
  }

  logout(): void {
    this.auth.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  }
}
