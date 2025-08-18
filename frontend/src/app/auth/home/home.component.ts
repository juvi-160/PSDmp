import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false,
})
export class HomeComponent implements OnInit {
  loading = false;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Only subscribe once to isLoggedIn
    this.authService
      .isLoggedIn()
      .pipe(take(1))
      .subscribe((isLoggedIn) => {
        console.log('User logged in status:', isLoggedIn);
      });
  }

  login(): void {
    this.loading = true;
    this.authService.login().subscribe({
      next: () => {
        this.handleRedirect();
      },
      error: (error) => {
        console.error('Login error:', error);
        this.loading = false;
      },
    });
  }

  signup(): void {
    this.loading = true;
    this.authService.signup().subscribe({
      next: () => {
        this.handleRedirect();
      },
      error: (error) => {
        console.error('Signup error:', error);
        this.loading = false;
      },
    });
  }

  loginWithGoogle(): void {
    this.loading = true;
    this.authService.loginWithGoogle().subscribe({
      next: () => {
        this.handleRedirect();
      },
      error: (error) => {
        console.error('Google login error:', error);
        this.loading = false;
      },
    });
  }

  /** ✅ Decide where to send the user after login/signup */
  private handleRedirect(): void {
    this.loading = false;

    // 🔹 Example: profileCompletion is stored in localStorage (pure frontend mock)
    const completion = Number(localStorage.getItem('profileCompletion')) || 0;

    if (completion < 100) {
      console.log('Redirecting to profile setup…');
      this.router.navigate(['/profile']);
    } else {
      console.log('Redirecting to dashboard…');
      this.router.navigate(['/dashboard']);
    }
  }
}
