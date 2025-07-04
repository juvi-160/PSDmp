import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { ToastService } from './toast.service';

export interface User {
  id?: string;
  auth0Id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'individual member' | 'associate member' | 'pending';
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  hasPaid?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private auth0: Auth0Service,
    private snackBar: MatSnackBar,
    private router: Router,
    private toast: ToastService
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser = this.currentUserSubject.asObservable();

    // Subscribe to Auth0 authentication state changes
    this.auth0.isAuthenticated$.subscribe((isAuthenticated) => {
      console.log('Auth0 authentication state:', isAuthenticated);

      if (isAuthenticated) {
        this.auth0.user$.subscribe((auth0User) => {
          if (auth0User) {
            console.log('Auth0 user:', auth0User);

            // First, try to get the user profile
            this.getUserProfile().subscribe({
              next: (user) => {
                console.log('User profile retrieved:', user);
                this.currentUserSubject.next(user);

                // NEW: Handle user redirection based on role and payment status
                this.handleUserRedirection(user);
              },
              error: (error) => {
                console.error('Error fetching user profile:', error);

                // If user doesn't exist in our database yet, create a new user with pending role
                if (error.status === 404) {
                  console.log('User not found, creating new user');

                  const newUser: User = {
                    name: auth0User.name || '',
                    email: auth0User.email || '',
                    role: 'pending',
                    isEmailVerified: auth0User.email_verified || false,
                  };

                  this.createUser(newUser).subscribe({
                    next: (createdUser) => {
                      console.log('User created successfully:', createdUser);
                      this.currentUserSubject.next(createdUser);
                      this.router.navigate(['/payment']);
                    },
                    error: (err) => {
                      console.error('Error creating user:', err);
                      this.toast.show('Error creating user profile', 'error');
                    },
                  });
                } else {
                  this.toast.show('Error fetching user profile', 'error');
                }
              },
            });
          }
        });
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  // NEW: Method to handle user redirection based on role and payment status
  private handleUserRedirection(user: User): void {
    if (user.role === 'admin') {
      this.router.navigate(['/admin']);
    } else if (user.role === 'associate member') {
      this.router.navigate(['/dashboard']);
    } else if (user.role === 'individual member' && !user.hasPaid) {
      this.router.navigate(['/payment']);
    } else if (user.role === 'individual member' && user.hasPaid) {
      this.router.navigate(['/dashboard']);
    } else if (user.role === 'pending') {
      this.router.navigate(['/payment']);
    }
  }

  // NEW: Method to check if user needs to pay
  checkUserPaymentStatus(): Observable<{ needsPayment: boolean, role: string }> {
    return this.getUserProfile().pipe(
      map(user => {
        const needsPayment =
          (user.role === 'individual member' && !user.hasPaid) ||
          user.role === 'pending';
        return { needsPayment, role: user.role };
      }),
      catchError(() => of({ needsPayment: true, role: 'pending' }))
    );
  }

  // NEW: Method to get the current user's name
  getUserName(): string {
    const currentUser = this.currentUserSubject.value;
    return currentUser ? currentUser.name : '';
  }

  // NEW: Method to get the current user's email
  getUserEmail(): string {
    const currentUser = this.currentUserSubject.value;
    return currentUser ? currentUser.email : '';
  }

  // EXISTING METHODS BELOW (NO CHANGES)
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(): Observable<void> {
    console.log('Initiating login...');
    return from(
      this.auth0.loginWithRedirect({
        authorizationParams: {
          redirect_uri: window.location.origin,
          audience: environment.auth0.audience,
        },
      })
    );
  }

  loginWithGoogle(): Observable<void> {
    console.log('Initiating Google login...');
    return from(
      this.auth0.loginWithRedirect({
        authorizationParams: {
          redirect_uri: window.location.origin,
          connection: 'google-oauth2',
          audience: environment.auth0.audience,
        },
      })
    );
  }

  signup(): Observable<void> {
    console.log('Initiating signup...');
    return from(
      this.auth0.loginWithRedirect({
        authorizationParams: {
          redirect_uri: window.location.origin,
          screen_hint: 'signup',
          audience: environment.auth0.audience,
        },
      })
    );
  }

  logout(): Observable<void> {
    return from(
      this.auth0.logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      })
    );
  }

  isLoggedIn(): Observable<boolean> {
    return this.auth0.isAuthenticated$;
  }

  getAccessToken(): Observable<string> {
    return this.auth0.getAccessTokenSilently({
      authorizationParams: {
        audience: environment.auth0.audience,
      },
    });
  }

  getUserProfile(): Observable<User> {
    return this.getAccessToken().pipe(
      switchMap((token) => {
        console.log('Access token obtained, fetching user profile');
        console.log('Token:', token);
        return this.http.get<User>(`${this.apiUrl}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
    );
  }

  createUser(user: User): Observable<User> {
    return this.getAccessToken().pipe(
      switchMap((token) => {
        console.log(
          'Creating user with token:',
          token.substring(0, 20) + '...'
        );
        return this.http.post<User>(`${this.apiUrl}/users`, user, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
    );
  }

  updateUserAfterPayment(paymentDetails: any): Observable<User> {
    return this.getAccessToken().pipe(
      switchMap((token) => {
        return this.http.post<User>(`${this.apiUrl}/payment/verify`, paymentDetails, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }),
      tap((user) => {
        this.currentUserSubject.next(user);
      })
    );
  }

  checkPaymentStatus(): Observable<boolean> {
    return this.getUserProfile().pipe(
      map((user) => user.hasPaid === true && user.role === 'individual member'),
      catchError(() => of(false))
    );
  }
}
