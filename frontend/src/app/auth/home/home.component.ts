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
        // No navigation or payment check here; handled in AuthService
      });
  }

  login(): void {
    this.loading = true;
    this.authService.login().subscribe({
      error: (error) => {
        console.error('Login error:', error);
        this.loading = false;
      },
    });
  }

  signup(): void {
    this.loading = true;
    this.authService.signup().subscribe({
      error: (error) => {
        console.error('Signup error:', error);
        this.loading = false;
      },
    });
  }

  loginWithGoogle(): void {
    this.loading = true;
    this.authService.loginWithGoogle().subscribe({
      error: (error) => {
        console.error('Google login error:', error);
        this.loading = false;
      },
    });
  }
}
