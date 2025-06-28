import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { UserService } from "../../../../core/services/user.service";
import { User } from "../../../../core/models/user.model";

@Component({
  selector: 'app-user-edit-dialog',
  standalone: false,
  templateUrl: './user-edit-dialog.component.html',
  styleUrl: './user-edit-dialog.component.css'
})
export class UserEditDialogComponent implements OnInit {
  editForm: FormGroup;
  loading = false;

  roles = [
    { value: "admin", label: "Admin" },
    { value: "individual member", label: "Individual Member" },
    { value: "associate member", label: "Associate Member" },
    { value: "pending", label: "Pending" },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<UserEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User }
  ) {
    this.editForm = this.formBuilder.group({
      role: [data.user.role, Validators.required],
      isEmailVerified: [data.user.isEmailVerified],
      isPhoneVerified: [data.user.isPhoneVerified],
      hasPaid: [data.user.hasPaid],
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (!this.editForm.valid) return;

    this.loading = true;
    const formData = this.editForm.value;
    const userId = this.data.user.id!;
    const previousRole = this.data.user.role;
    const newRole = formData.role;

    // First: Update core user info (email verified, phone, payment)
    this.userService.updateUser(userId, {
      isEmailVerified: formData.isEmailVerified,
      isPhoneVerified: formData.isPhoneVerified,
      hasPaid: formData.hasPaid,
    }).subscribe({
      next: () => {
        // Then: if role has changed, update role and trigger email
        if (previousRole !== newRole) {
          this.userService.updateUserRole(userId, newRole).subscribe({
            next: (res) => {
              this.loading = false;
              this.snackBar.open("User updated successfully", "Close", { duration: 3000 });

              if (previousRole === 'associate member' && newRole === 'individual member') {
                if (res.emailSent) {
                  this.snackBar.open("Email sent to user successfully.", "Close", { duration: 3000 });
                } else {
                  this.snackBar.open("Failed to send email to user.", "Close", { duration: 3000 });
                }
              }

              this.dialogRef.close(res.user);
            },
            error: (err) => {
              this.loading = false;
              console.error("Error updating role:", err);
              this.snackBar.open("User updated, but role change failed.", "Close", { duration: 4000 });
              this.dialogRef.close();
            }
          });
        } else {
          // No role change — done
          this.loading = false;
          this.snackBar.open("User updated successfully", "Close", { duration: 3000 });
          this.dialogRef.close();
        }
      },
      error: (err) => {
        this.loading = false;
        console.error("Error updating user:", err);
        this.snackBar.open("Failed to update user", "Close", { duration: 5000 });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
