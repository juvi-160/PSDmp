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
  isAssociateMember = false;
  isIndividualMember = false;
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

      this.http.get<any>(`${environment.apiUrl}/admin/check-user-role/${email}`).subscribe({
        next: (roleData) => {
          const role = roleData.role?.toLowerCase();

          // Set role flags
          this.isAdmin = role === 'admin';
          this.isAssociateMember = role === 'associate member';
          this.isIndividualMember = role === 'individual member';

          // Store role and flags in localStorage
          localStorage.setItem('userRole', role || 'individual member');
          localStorage.setItem('isAdmin', JSON.stringify(this.isAdmin));
          localStorage.setItem('isAssociateMember', JSON.stringify(this.isAssociateMember));

          // Apply global body class
          this.setBodyTheme(role);

          // Setup navigation items
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

      // Load from localStorage on reload
      const storedRole = localStorage.getItem('userRole') || 'individual member';
      this.isAdmin = JSON.parse(localStorage.getItem('isAdmin') || 'false');
      this.isAssociateMember = JSON.parse(localStorage.getItem('isAssociateMember') || 'false');
      this.isIndividualMember = storedRole === 'individual member';

      this.setBodyTheme(storedRole);
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

  private setBodyTheme(role: string | null): void {
    document.body.classList.remove('admin-theme', 'associate-theme', 'individual-theme');

    switch (role) {
      case 'admin':
        document.body.classList.add('admin-theme');
        break;
      case 'associate member':
        document.body.classList.add('associate-theme');
        break;
      default:
        document.body.classList.add('individual-theme');
    }
  }
}
