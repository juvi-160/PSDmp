import { Component,ViewChild  } from '@angular/core';
import { Router } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: false
})
export class DashboardComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  navItems = [
    { icon: 'dashboard', label: 'Dashboard', link: '/dashboard' },
    { icon: 'newspaper', label: 'Events', link: '/dashboard/event' },
    { icon: 'event_note', label: 'My Events', link: '/dashboard/my-events' },
    { icon: 'support', label: 'Raise Query/Ticket', link: '/dashboard/raise-ticket' },
    { icon: 'confirmation_number', label: 'My Tickets', link: '/dashboard/my-tickets' },
    { icon: 'account_circle', label: 'Profile', link: '/dashboard/profile' },
  ];

  constructor(
    private router: Router,
    public auth: AuthService,
  ) {}

  toggleSidenav() {
    this.sidenav.toggle();
  }

  logout() {
    this.auth.logout({ logoutParams: { returnTo: window.location.origin } });
  }
}
