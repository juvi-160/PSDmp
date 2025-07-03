import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { UserService } from "../../../../core/services/user.service";
import { User } from "../../../../core/models/user.model";
import { ToastService } from "../../../../core/services/toast.service";

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  standalone: false,
  styleUrls: ['./user-details.component.css']
})
export class UserDetailsComponent implements OnInit {
  userId!: string; // e.g., PSF_00001
  user: User | null = null;
  loading = false;
  error = "";
  togglingAutoPay = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.userId = params["id"];
      if (this.userId) {
        this.loadUserDetails();
      } else {
        this.error = "Invalid user ID.";
      }
    });
  }

  loadUserDetails(): void {
    this.loading = true;
    this.error = "";

    this.userService.getUserById((this.userId)).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: (error) => {
        this.error = "Failed to load user details. Please try again.";
        this.loading = false;
        console.error("Error loading user details:", error);
      },
    });
  }

  toggleAutoPay(): void {
    if (!this.user) return;
    this.togglingAutoPay = true;

    const action = this.user.autoPayEnabled
      ? this.userService.disableAutoPay()
      : this.userService.enableAutoPay();

    action.subscribe({
      next: (res) => {
        this.user!.autoPayEnabled = !this.user!.autoPayEnabled;
        this.toast.show(`AutoPay ${this.user!.autoPayEnabled ? 'enabled' : 'disabled'} successfully`, 'success');
        this.togglingAutoPay = false;
      },
      error: (err) => {
        this.toast.show('Failed to update AutoPay status', 'error');
        console.error('AutoPay toggle error:', err);
        this.togglingAutoPay = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(["/admin/users"]);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  getPaymentStatusClass(hasPaid: boolean): string {
    return hasPaid ? "status-paid" : "status-pending";
  }

  getPaymentStatusClassByStatus(status: string): string {
    switch (status) {
      case "paid":
        return "status-paid";
      case "created":
        return "status-pending";
      case "failed":
        return "status-failed";
      default:
        return "status-pending";
    }
  }

  getRoleClass(role: string): string {
    switch (role) {
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
    switch (status) {
      case "active":
        return "status-active";
      case "cancelled":
        return "status-cancelled";
      default:
        return "status-inactive";
    }
  }
}
