import { Injectable } from "@angular/core"
import  { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from "@angular/router"
import {  Observable, of } from "rxjs"
import { catchError, tap } from "rxjs/operators"
import  { AuthService } from "../services/auth.service"

@Injectable({
  providedIn: "root",
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.authService.isLoggedIn().pipe(
      tap((isLoggedIn) => {
        if (!isLoggedIn) {
          this.router.navigate(["/"])
        }
      }),
      catchError(() => {
        this.router.navigate(["/"])
        return of(false)
      }),
    )
  }
}
