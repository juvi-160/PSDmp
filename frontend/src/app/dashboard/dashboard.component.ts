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
  navItems: { icon: string, label: string, link: string }[] = [];

  constructor(
    private router: Router,
    public auth: AuthService,
    private http: HttpClient
  ) {}

 ngOnInit(): void {
 this.auth.user$.subscribe((user: any) => {
  if (!user?.email) return;

  const email = user.email; // ✅ Define email

  this.http.get<any>(`${environment.apiUrl}/payment-history/users/by-email/${email}`)
    .subscribe({
      next: (userData) => {
        const uuid = userData.id;

        this.navItems = [
          { icon: 'dashboard', label: 'Dashboard', link: '/dashboard' },
          { icon: 'newspaper', label: 'Events', link: '/dashboard/event' },
          { icon: 'event_note', label: 'My Events', link: '/dashboard/my-events' },
          { icon: 'support', label: 'Raise Query/Ticket', link: '/dashboard/raise-ticket' },
          { icon: 'confirmation_number', label: 'My Tickets', link: '/dashboard/my-tickets' },
          { icon: 'account_circle', label: 'Profile', link: '/dashboard/profile' },
          { icon: 'money', label: 'Payment History', link: `/dashboard/payment-history/users/${uuid}` }
        ];
      },
      error: (err) => {
        console.error('Failed to load user by email:', err);
      }
    });

  // Optional admin role check
  this.isAdmin =
    user?.['http://localhost:3000/roles']?.includes('admin') ||
    user?.app_metadata?.roles?.includes('admin') ||
    user?.user_metadata?.role === 'admin';
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
