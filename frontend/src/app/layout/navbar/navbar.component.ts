import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class  NavbarComponent {
  isMenuOpen = false;

  constructor(private router: Router) {}

  // Check if the current route matches the given path
  isActive(route: string): boolean {
    return this.router.url === route;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  navigateHome() {
    this.router.navigate(['/']);
  }
}
