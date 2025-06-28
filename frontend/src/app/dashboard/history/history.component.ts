import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-history',
  standalone: false,
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit {
  userId: number | null = null;
  user: User | null = null;
  loading = false;
  error = "";

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = +params["id"];
      if (isNaN(id)) {
        this.handleInvalidId();
        return;
      }
      this.userId = id;
      this.loadUserDetails();
    });
  }

  private handleInvalidId(): void {
    this.error = "Invalid user ID provided";
    this.snackBar.open(this.error, 'Dismiss', { duration: 5000 });
    this.router.navigate(['/admin/users']); // Or your preferred fallback route
  }

  loadUserDetails(): void {
    if (this.userId === null) {
      this.handleInvalidId();
      return;
    }

    this.loading = true;
    this.error = "";

    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        
        if (error.status === 404) {
          this.error = "User not found";
        } else {
          this.error = "Failed to load user details. Please try again.";
        }
        
        console.error("Error loading user details:", error);
        this.snackBar.open(this.error, 'Dismiss', { duration: 5000 });
      },
    });
  }

  goBack(): void {
    this.router.navigate(["/admin/users"]);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  }

  getPaymentStatusClass(hasPaid: boolean): string {
    return hasPaid ? "status-paid" : "status-pending";
  }

  getPaymentStatusClassByStatus(status: string): string {
    switch (status.toLowerCase()) {
      case "paid":
        return "status-paid";
      case "created":
      case "pending":
        return "status-pending";
      case "failed":
        return "status-failed";
      default:
        return "status-pending";
    }
  }

  getRoleClass(role: string): string {
    switch (role.toLowerCase()) {
      case "admin":
        return "role-admin";
      case "individual member":
        return "role-member";
      case "associate member":
        return "role-associate";
      case "pending":
        return "role-pending";
      default:
        return "";
    }
  }

  getAutoPayStatusClass(autoPayEnabled?: boolean): string {
    return autoPayEnabled ? "autopay-active" : "autopay-inactive";
  }

  getAutoPayIcon(autoPayEnabled?: boolean): string {
    return autoPayEnabled ? "check_circle" : "cancel";
  }

  getAutoPayStatusText(autoPayEnabled?: boolean): string {
    return autoPayEnabled ? "Yes" : "No";
  }

  getSubscriptionStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case "active":
        return "status-active";
      case "cancelled":
        return "status-cancelled";
      default:
        return "status-inactive";
    }
  }
}