import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';  // Assuming you are using Auth0 for authentication
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  canActivate(): Observable<boolean> {
    return this.auth.user$.pipe(
      switchMap((user: any) => {
        if (!user?.email) {
          console.log('No user email found.');
          return [false];  // Return an observable of false if no user email is found
        }

        const email = user.email;
        console.log('User email:', email);

        // Fetch role data from the backend (same as in DashboardComponent)
        return this.http.get<any>(`${environment.apiUrl}/admin/check-user-role/${email}`).pipe(
          map(roleData => {
            console.log('Role data fetched from backend:', roleData);

            const role = roleData.role?.toLowerCase();
            console.log('Role:', role);

            // Set role flags
            const isAdmin = role === 'admin';
            const isAssociateMember = role === 'associate member';
            const isIndividualMember = role === 'individual member';

            // Store role and flags in localStorage
            localStorage.setItem('userRole', role || 'individual member');
            localStorage.setItem('isAdmin', JSON.stringify(isAdmin));
            localStorage.setItem('isAssociateMember', JSON.stringify(isAssociateMember));

            console.log('isAdmin:', isAdmin);
            console.log('isAssociateMember:', isAssociateMember);
            console.log('isIndividualMember:', isIndividualMember);

            // If not an admin, redirect to dashboard
            if (!isAdmin) {
              console.log('User is not an admin, redirecting to dashboard');
              this.router.navigate(['/dashboard']);
              return false;
            }

            // Apply body theme for admin role
            document.body.classList.remove('admin-theme', 'associate-theme', 'individual-theme');
            document.body.classList.add('admin-theme');

            return true;  // Allow access to the admin dashboard
          })
        );
      })
    );
  }
}
