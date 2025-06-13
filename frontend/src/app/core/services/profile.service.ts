import { Injectable } from "@angular/core"
import  { HttpClient } from "@angular/common/http"
import  { Observable } from "rxjs"
import { switchMap, map } from "rxjs/operators"
import { environment } from "../../environments/environment"
import  { AuthService } from "./auth.service"
import  { User, ProfileUpdateData } from "../models/user.model"

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/profile`

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

   getUserProfile(): Observable<User> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        return this.http.get<User>(this.apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }),
      map((user) => ({
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      })),
    )
  }

  // Update user profile
  updateUserProfile(profileData: ProfileUpdateData): Observable<User> {
    return this.authService.getAccessToken().pipe(
      switchMap((token) => {
        return this.http.put<User>(this.apiUrl, profileData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      }),
      map((user) => ({
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      })),
    )
  }
}