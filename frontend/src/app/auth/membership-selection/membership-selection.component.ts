import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-membership-selection',
  standalone: false,
  templateUrl: './membership-selection.component.html',
  styleUrls: ['./membership-selection.component.css'],
})
export class MembershipSelectionComponent implements OnInit {
  loading = false;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Subscribe to the authentication status
    this.authService.isAuthenticated$.pipe(take(1)).subscribe((isLoggedIn) => {
      console.log('User logged in status:', isLoggedIn);
      // Handle redirection or any other logic after checking login status
    });
  }

  login(): void {
    this.loading = true;
    this.authService.loginWithRedirect({
      appState: { target: this.router.url },
      // Use authParams for additional configurations
      authorizationParams: { screen_hint: 'signup' }, // Sign-up hint
    }).subscribe({
      error: (error) => {
        console.error('Login error:', error);
        this.loading = false;
      },
    });
  }

  signup(): void {
    this.loading = true;
    this.authService.loginWithRedirect({
      appState: { target: this.router.url },
      authorizationParams: { screen_hint: 'signup' }, // Sign-up hint
    }).subscribe({
      error: (error) => {
        console.error('Signup error:', error);
        this.loading = false;
      },
    });
  }

  loginWithGoogle(): void {
    this.loading = true;
    this.authService.loginWithRedirect({
      appState: { target: this.router.url },
      authorizationParams: { connection: 'google-oauth2' }, // Specify Google connection
    }).subscribe({
      error: (error) => {
        console.error('Google login error:', error);
        this.loading = false;
      },
    });
  }
}
