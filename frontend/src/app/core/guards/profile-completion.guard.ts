import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ProfileCompletionGuard implements CanActivate, CanActivateChild {
  constructor(private router: Router) {}

  private isComplete(): boolean {
    // Must be exactly "100"
    return localStorage.getItem('profileCompletion') === '100';
  }

  private handle(state: RouterStateSnapshot): boolean {
    if (this.isComplete()) return true;

    // allow staying on profile to complete it
    const url = state.url || '';
    if (url.startsWith('/profile') || url.startsWith('/dashboard/profile')) return true;

    // send them to the profile page (prefer dashboard/profile if they were trying to access dashboard)
    const target = url.startsWith('/dashboard') ? '/dashboard/profile' : '/profile';
    this.router.navigate([target], { queryParams: { redirect: state.url } });
    return false;
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.handle(state);
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.handle(state);
  }
}
