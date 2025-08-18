import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { switchMap, map, catchError } from "rxjs/operators";
import { environment } from "../../environments/environment";
import { AuthService } from "./auth.service";
import { User, ProfileUpdateData } from "../models/user.model";

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/profile`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  /** Helper to build headers with token */
  private buildHeaders(token: string, json: boolean = true): HttpHeaders {
    const headers: any = {
      Authorization: `Bearer ${token}`,
    };
    if (json) {
      headers["Content-Type"] = "application/json";
    }
    return new HttpHeaders(headers);
  }

  /** Fetch logged-in user's profile */
  getUserProfile(): Observable<User> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) =>
        this.http.get<User>(this.apiUrl, {
          headers: this.buildHeaders(token, false),
        })
      ),
      map((user) => ({
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      })),
      catchError((error) => {
        console.error("Error fetching user profile:", error);
        return throwError(() => error);
      })
    );
  }

  /** Update user profile */
  updateUserProfile(profileData: ProfileUpdateData): Observable<User> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) =>
        this.http.put<User>(this.apiUrl, profileData, {
          headers: this.buildHeaders(token),
        })
      ),
      map((user) => ({
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      })),
      catchError((error) => {
        console.error("Error updating profile:", error);
        return throwError(() => error);
      })
    );
  }

  /** Mark phone as verified */
  markPhoneVerified(): Observable<{ success: boolean; message?: string }> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) =>
        this.http.post<{ success: boolean; message?: string }>(
          `${this.apiUrl}/mark-phone-verified`,
          {},
          { headers: this.buildHeaders(token) }
        )
      ),
      catchError((error) => {
        console.error("Error marking phone verified:", error);
        return throwError(() => error);
      })
    );
  }
}
