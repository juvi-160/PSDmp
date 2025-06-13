import { Injectable } from "@angular/core"
import  { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from "@angular/common/http"
import {  Observable, throwError } from "rxjs"
import { catchError } from "rxjs/operators"
import  { AuthService } from "../services/auth.service"
import  { MatSnackBar } from "@angular/material/snack-bar"
import  { Router } from "@angular/router"

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Auto logout if 401 response returned from API
          this.authService.logout().subscribe()
          this.router.navigate(["/"])
        }

        const errorMessage = error.error?.message || "An unknown error occurred"
        this.snackBar.open(errorMessage, "Close", {
          duration: 5000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
        })

        return throwError(() => error)
      }),
    )
  }
}
