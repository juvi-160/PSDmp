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
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private auth0: Auth0Service,
    private router: Router,
    private toast: ToastService
  ) {
    this.auth0.isAuthenticated$
      .pipe(
        switchMap((isAuthenticated) => {
          if (isAuthenticated) {
            return this.auth0.user$;
          } else {
            this.currentUserSubject.next(null);
            return of(null);
          }
        }),
        switchMap((auth0User) => {
          if (!auth0User) return of(null);

          return this.getUserProfile().pipe(
            catchError((error) => {
              if (error.status === 404) {
                const newUser: User = {
                  name: auth0User.name || '',
                  email: auth0User.email || '',
                  role: 'pending',
                  isEmailVerified: auth0User.email_verified || false,
                };
                return this.createUser(newUser);
              } else {
                this.toast.show('Error fetching user profile', 'error');
                return of(null);
              }
            })
          );
        })
      )
      .subscribe((user) => {
        if (user) {
          this.currentUserSubject.next(user);
          this.handleUserRedirection(user);
        }
      });
  }

  private handleUserRedirection(user: User): void {
    if (user.role === 'admin') {
      this.router.navigate(['/admin']);
    } else if (user.role === 'associate member') {
      this.router.navigate(['/dashboard']);
    } else if (user.role === 'individual member') {
      user.hasPaid ? this.router.navigate(['/dashboard']) : this.router.navigate(['/payment']);
    } else if (user.role === 'pending') {
      this.router.navigate(['/payment']);
    }
  }

  getUserProfile(): Observable<User> {
    return this.getAccessToken().pipe(
      switchMap((token) =>
        this.http.get<User>(`${environment.apiUrl}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ),
      map((user) => ({
        ...user,
        createdAt: user.createdAt ? new Date(user.createdAt) : undefined,
        updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined,
      }))
    );
  }

  createUser(user: User): Observable<User> {
    return this.getAccessToken().pipe(
      switchMap((token) =>
        this.http.post<User>(`${this.apiUrl}/users`, user, {
          headers: { Authorization: `Bearer ${token}` },
        })
      )
    );
  }

  updateUserProfile(profileData: ProfileUpdateData): Observable<User> {
    return this.getAccessToken().pipe(
      switchMap((token) =>
        this.http.put<User>(`${environment.apiUrl}/profile`, profileData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ),
      tap((user) => this.currentUserSubject.next(user))
    );
  }

  markPhoneVerified(): Observable<any> {
    return this.getAccessToken().pipe(
      switchMap((token) =>
        this.http.post<any>(`${environment.apiUrl}/profile/mark-phone-verified`, {}, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      )
    );
  }

  updateUserAfterPayment(paymentDetails: any): Observable<User> {
    return this.getAccessToken().pipe(
      switchMap((token) =>
        this.http.post<User>(`${this.apiUrl}/payment/verify`, paymentDetails, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ),
      tap((user) => this.currentUserSubject.next(user))
    );
  }

  checkPaymentStatus(): Observable<boolean> {
    return this.getUserProfile().pipe(
      map((user) => user.hasPaid === true && user.role === 'individual member'),
      catchError(() => of(false))
    );
  }

  checkUserPaymentStatus(): Observable<{ needsPayment: boolean; role: string }> {
    return this.getUserProfile().pipe(
      map((user) => ({
        needsPayment: (user.role === 'individual member' && !user.hasPaid) || user.role === 'pending',
        role: user.role,
      })),
      catchError(() => of({ needsPayment: true, role: 'pending' }))
    );
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

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  getUserName(): string {
    return this.currentUserSubject.value?.name || '';
  }

  getUserEmail(): string {
    return this.currentUserSubject.value?.email || '';
  }
}
