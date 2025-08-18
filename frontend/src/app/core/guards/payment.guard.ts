import { Injectable } from "@angular/core";
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from "@angular/router";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { AuthService } from "../services/auth.service";

@Injectable({
  providedIn: "root",
})
export class PaymentGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.authService.checkUserPaymentStatus().pipe(
      map(({ needsPayment, role, profileCompleted }) => {
        // Associate members can go to dashboard if profile is complete
        if (role === 'associate member' && profileCompleted) {
          this.router.navigate(['/dashboard']);
          return false;
        }
        
        // Admins can go to dashboard
        if (role === 'admin'&& profileCompleted && !needsPayment) {
          this.router.navigate(['/dashboard']);
          return false;
        }
        
        // Individual members need complete profile AND payment
        if (role === 'individual member' && profileCompleted && !needsPayment) {
          this.router.navigate(['/dashboard']);
          return false;
        }
        
        // All other cases stay on payment page
        return true;
      }),
      catchError(() => {
        this.router.navigate(['/']);
        return of(false);
      })
    );
  }
}