import { Component,  OnInit } from "@angular/core"
import  { ActivatedRoute, Router } from "@angular/router"
import  { MatSnackBar } from "@angular/material/snack-bar"
import { UserService } from "../../../../core/services/user.service"
import { User } from "../../../../core/models/user.model"

@Component({
  selector: 'app-user-details',
  standalone: false,
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css'
})
export class UserDetailsComponent implements OnInit {
  userId!: number
  user: User | null = null
  loading = false
  error = ""

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.userId = +params["id"]
      this.loadUserDetails()
    })
  }

  loadUserDetails(): void {
    this.loading = true
    this.error = ""

    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.user = user
        this.loading = false
      },
      error: (error) => {
        this.error = "Failed to load user details. Please try again."
        this.loading = false
        console.error("Error loading user details:", error)
      },
    })
  }

  goBack(): void {
    this.router.navigate(["/admin/users"])
  }

  formatDate(date: Date | undefined): string {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString()
  }

  getPaymentStatusClass(hasPaid: boolean): string {
    return hasPaid ? "status-paid" : "status-pending"
  }

  getPaymentStatusClassByStatus(status: string): string {
    switch (status) {
      case "paid":
        return "status-paid"
      case "created":
        return "status-pending"
      case "failed":
        return "status-failed"
      default:
        return "status-pending"
    }
  }

  getRoleClass(role: string): string {
    switch (role) {
      case "admin":
        return "role-admin"
      case "individual member":
        return "role-member"
      case "associate member":
        return "role-associate"
      case "pending":
        return "role-pending"
      default:
        return ""
    }
  }

  getAutoPayStatusClass(autoPayEnabled?: boolean): string {
    return autoPayEnabled ? "autopay-active" : "autopay-inactive"
  }

  getAutoPayIcon(autoPayEnabled?: boolean): string {
    return autoPayEnabled ? "check_circle" : "cancel"
  }

  getAutoPayStatusText(autoPayEnabled?: boolean): string {
    return autoPayEnabled ? "Yes" : "No"
  }

  getSubscriptionStatusClass(status: string): string {
    switch (status) {
      case "active":
        return "status-active"
      case "cancelled":
        return "status-cancelled"
      default:
        return "status-inactive"
    }
  }
}


