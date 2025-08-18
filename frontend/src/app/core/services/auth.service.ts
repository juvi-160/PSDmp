import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
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
  profileCompleted?: boolean; // Add this line
}

interface ProfileUpdateData {
  phone?: string;
  ageGroup?: string;
  profession?: string;
  city?: string;
  company?: string;
  position?: string;
  area_of_interests?: string[] | string;
  about_you?: string;
  agreed_to_terms?: boolean;
  agreed_to_contribute?: boolean;
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
    private router: Router,
    private toast: ToastService
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser = this.currentUserSubject.asObservable();

    this.auth0.isAuthenticated$.subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.auth0.user$.subscribe((auth0User) => {
          if (auth0User) {
            this.getUserProfile().subscribe({
              next: (user: User) => {
                this.currentUserSubject.next(user);
                this.handleUserRedirection(user);
              },
              error: (error: any) => {
                if (error.status === 404) {
                  const newUser: User = {
                    name: auth0User.name || '',
                    email: auth0User.email || '',
                    role: 'pending',
                    isEmailVerified: auth0User.email_verified || false,
                  };

                  this.createUser(newUser).subscribe({
                    next: (createdUser: User) => {
                      this.currentUserSubject.next(createdUser);
                      this.router.navigate(['/payment']);
                    },
                    error: (err: any) => {
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

  public handleUserRedirection(user: User): void {
    console.log('Handling redirection for:', {
      role: user.role,
      profileCompleted: user.profileCompleted,
      hasPaid: user.hasPaid
    });

    // Pending users always go to payment
    if (user.role === 'pending') {
      this.router.navigate(['/payment']);
      return;
    }

    // Admin goes straight to dashboard (assuming they don't need payment)
    if (user.role === 'admin' && !user.hasPaid) {
      this.router.navigate(['/payment']);
      return;
    }

    // Check profile completion first for all non-admin users
    if (!user.profileCompleted) {
      this.router.navigate(['/payment']);
      return;
    }

    // For individual members, check payment status
    if (user.role === 'individual member'  && !user.hasPaid) {
      this.router.navigate(['/payment']);
      return;
    }

    // For associate members or completed individual members, go to dashboard
    this.router.navigate(['/dashboard']);
  }

  checkUserPaymentStatus(): Observable<{ needsPayment: boolean, role: string, profileCompleted: boolean }> {
    return this.getUserProfile().pipe(
      map((user: User) => ({
        needsPayment: (user.role === 'individual member' && !user.hasPaid) || user.role === 'pending',
        role: user.role,
        profileCompleted: user.profileCompleted || false
      })),
      catchError(() => of({ needsPayment: true, role: 'pending', profileCompleted: false }))
    );
  }
  getUserName(): string {
    const currentUser = this.currentUserSubject.value;
    return currentUser?.name || '';
  }

  getUserEmail(): string {
    const currentUser = this.currentUserSubject.value;
    return currentUser?.email || '';
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(): Observable<void> {
    return from(
      this.auth0.loginWithRedirect({
        authorizationParams: {
          redirect_uri: window.location.origin,
          audience: environment.auth0.audience,
        },
      })
    );
  }

  updateUserProfile(profileData: ProfileUpdateData): Observable<User> {
    return this.getAccessToken().pipe(
      switchMap((token: string) => {
        return this.http.put<User>(`http://localhost:3000/api/profile`, profileData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }),
      tap((user: User) => {
        this.currentUserSubject.next(user);
      })
    );
  }

  loginWithGoogle(): Observable<void> {
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
        return this.http.get<User>(`http://localhost:3000/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }),
      map((user) => ({
        ...user,
        createdAt: user.createdAt ? new Date(user.createdAt) : undefined,
        updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined,
      })),
    );
  }

  createUser(user: User): Observable<User> {
    return this.getAccessToken().pipe(
      switchMap((token: string) => {
        return this.http.post<User>(`${this.apiUrl}/users`, user, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
    );
  }

  markPhoneVerified(): Observable<any> {
    return this.getAccessToken().pipe(
      switchMap((token: string) => {
        return this.http.post<any>(`http://localhost:3000/api/mark-phone-verified`, {}, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      })
    );
  }

  updateUserAfterPayment(paymentDetails: any): Observable<User> {
    return this.getAccessToken().pipe(
      switchMap((token: string) => {
        return this.http.post<User>(`${this.apiUrl}/payment/verify`, paymentDetails, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }),
      tap((user: User) => {
        this.currentUserSubject.next(user);
      })
    );
  }

  checkPaymentStatus(): Observable<boolean> {
    return this.getUserProfile().pipe(
      map((user: User) => user.hasPaid === true && user.role === 'individual member'),
      catchError(() => of(false))
    );
  }
}