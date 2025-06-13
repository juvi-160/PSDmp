import { Injectable } from "@angular/core"
import type { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from "@angular/router"
import { type Observable, of } from "rxjs"
import { catchError, map, switchMap } from "rxjs/operators"
import type { AuthService } from "../services/auth.service"

@Injectable({
  providedIn: "root",
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const requiredRole = route.data["role"] as string

    return this.authService.isLoggedIn().pipe(
      switchMap((isLoggedIn) => {
        if (!isLoggedIn) {
          this.router.navigate(["/"])
          return of(false)
        }

        return this.authService.getUserProfile().pipe(
          map((user) => {
            if (user.role === requiredRole) {
              return true
            }

            this.router.navigate(["/dashboard"])
            return false
          }),
        )
      }),
      catchError(() => {
        this.router.navigate(["/"])
        return of(false)
      }),
    )
  }
}
