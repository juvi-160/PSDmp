// src/app/core/interceptors/auth.interceptor.ts
import { Injectable } from "@angular/core";
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from "@angular/common/http";
import { Observable, from, lastValueFrom, throwError } from "rxjs";
import { catchError, mergeMap } from "rxjs/operators";
import { AuthService } from "../services/auth.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip interceptor for Auth0 requests
    if (request.url.includes('auth0.com')) {
      return next.handle(request);
    }
    
    // Get the auth token from the service
    return from(lastValueFrom(this.authService.getAccessToken())).pipe(
      mergeMap((token) => {
        // Clone the request and replace the original headers with
        // cloned headers, updated with the authorization.
        if (token) {
          console.log(`Adding token to request: ${request.url}`);
          const authReq = request.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
          });
          return next.handle(authReq);
        }
        return next.handle(request);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('HTTP request error:', error);
        return throwError(() => error);
      })
    );
  }
}