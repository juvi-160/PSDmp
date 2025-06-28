import { Component,  OnInit, ViewChild } from "@angular/core"
import  { FormBuilder, FormGroup } from "@angular/forms"
import { MatTableDataSource } from "@angular/material/table"
import { MatPaginator } from "@angular/material/paginator"
import { MatSort } from "@angular/material/sort"
import  { MatDialog } from "@angular/material/dialog"
import  { MatSnackBar } from "@angular/material/snack-bar"
import  { Router } from "@angular/router"
import { UserService } from "../../../../core/services/user.service"
import  { User, UserFilter } from "../../../../core/models/user.model"
import { UserEditDialogComponent } from "../user-edit-dialog/user-edit-dialog.component"
import { ConfirmDialogComponent } from "../../shared/confirm-dialog/confirm-dialog.component"

@Component({
  selector: 'app-user-management',
  standalone: false,
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css',
})
export class UserManagementComponent implements OnInit {
  displayedColumns: string[] = [
    "id",
    "name",
    "email",
    "role",
    "hasPaid",
    "paymentAmount",
    "autoPayStatus",
    "createdAt",
    "actions",
  ]

  dataSource = new MatTableDataSource<User>([])
  filterForm: FormGroup
  loading = false
  error = ""
  stats = {
    totalUsers: 0,
    paidUsers: 0,
    pendingUsers: 0,
    totalRevenue: 0,
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator
  @ViewChild(MatSort) sort!: MatSort

  constructor(
    private userService: UserService,
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {
    this.filterForm = this.formBuilder.group({
      search: [""],
      role: [""],
      paymentStatus: [""],
      dateFrom: [null],
      dateTo: [null],
    })
  }

  ngOnInit(): void {
    this.loadUsers()
    this.loadStats()
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator
    this.dataSource.sort = this.sort
  }

  loadUsers(): void {
    this.loading = true
    this.error = ""

    const filter: UserFilter = {
      search: this.filterForm.get("search")?.value,
      role: this.filterForm.get("role")?.value,
      paymentStatus:
        this.filterForm.get("paymentStatus")?.value === "true"
          ? true
          : this.filterForm.get("paymentStatus")?.value === "false"
            ? false
            : undefined,
      dateFrom: this.filterForm.get("dateFrom")?.value,
      dateTo: this.filterForm.get("dateTo")?.value,
    }

    this.userService.getUsers(filter).subscribe({
      next: (users) => {
        this.dataSource.data = users
        this.loading = false
      },
      error: (error) => {
        this.error = "Failed to load users. Please try again."
        this.loading = false
        console.error("Error loading users:", error)
      },
    })
  }

  loadStats(): void {
    this.userService.getUserStats().subscribe({
      next: (stats) => {
        this.stats = stats
      },
      error: (error) => {
        console.error("Error loading stats:", error)
      },
    })
  }

  applyFilter(): void {
    this.loadUsers()
  }

  resetFilter(): void {
    this.filterForm.reset({
      search: "",
      role: "",
      paymentStatus: "",
      dateFrom: null,
      dateTo: null,
    })
    this.loadUsers()
  }

  viewUserDetails(user: User): void {
    this.router.navigate(["/admin/users", user.id])
  }

  editUser(user: User): void {
    const dialogRef = this.dialog.open(UserEditDialogComponent, {
      width: "500px",
      data: { user },
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers()
        this.loadStats()
      }
    })
  }

  deleteUser(user: User): void {
    if (user.role === "admin") {
      this.snackBar.open("Cannot delete admin users", "Close", { duration: 3000 })
      return
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "400px",
      data: {
        title: "Delete User",
        message: `Are you sure you want to delete user "${user.name}"? This action cannot be undone.`,
        confirmText: "Delete",
        cancelText: "Cancel",
      },
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.userService.deleteUser(user.id!).subscribe({
          next: () => {
            this.snackBar.open("User deleted successfully", "Close", { duration: 3000 })
            this.loadUsers()
            this.loadStats()
          },
          error: (error) => {
            console.error("Error deleting user:", error)
            this.snackBar.open("Failed to delete user", "Close", { duration: 5000 })
          },
        })
      }
    })
  }

  exportToExcel(): void {
    this.loading = true

    const filter: UserFilter = {
      search: this.filterForm.get("search")?.value,
      role: this.filterForm.get("role")?.value,
      paymentStatus:
        this.filterForm.get("paymentStatus")?.value === "true"
          ? true
          : this.filterForm.get("paymentStatus")?.value === "false"
            ? false
            : undefined,
      dateFrom: this.filterForm.get("dateFrom")?.value,
      dateTo: this.filterForm.get("dateTo")?.value,
    }

    this.userService.exportUsersToExcel(filter).subscribe({
      next: (blob) => {
        this.loading = false

        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `users_export_${new Date().toISOString().split("T")[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        this.snackBar.open("Export successful", "Close", { duration: 3000 })
      },
      error: (error) => {
        this.loading = false
        console.error("Error exporting users:", error)
        this.snackBar.open("Failed to export users", "Close", { duration: 5000 })
      },
    })
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString()
  }

  getPaymentAmount(user: User): string {
    return user.formattedPaymentAmount || "₹0"
  }

  getPaymentStatusClass(hasPaid: boolean): string {
    return hasPaid ? "status-paid" : "status-pending"
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
}
