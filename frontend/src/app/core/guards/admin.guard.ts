import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate() {
    return this.auth.user$.pipe(
      map((user: any) => {
        const isAdmin = user?.['http://localhost:3000/roles']?.includes('admin') || 
                       user?.app_metadata?.roles?.includes('admin') ||
                       user?.user_metadata?.role === 'admin';
        
        if (!isAdmin) {
          this.router.navigate(['/dashboard']);
          return false;
        }
        return true;
      })
    );
  }
}