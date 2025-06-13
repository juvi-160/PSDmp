import { Component,  Inject,  OnInit } from "@angular/core"
import {  FormBuilder,  FormGroup, Validators } from "@angular/forms"
import  { MatDialogRef, MAT_DIALOG_DATA  } from "@angular/material/dialog"
import  { MatSnackBar } from "@angular/material/snack-bar"
import { UserService } from "../../../../core/services/user.service"
import { User } from "../../../../core/models/user.model"
@Component({
  selector: 'app-user-edit-dialog',
  standalone: false,
  templateUrl: './user-edit-dialog.component.html',
  styleUrl: './user-edit-dialog.component.css'
})
export class UserEditDialogComponent implements OnInit {
  editForm: FormGroup
  loading = false

  roles = [
    { value: "admin", label: "Admin" },
    { value: "individual member", label: "Individual Member" },
    { value: "associate member", label: "Associate Member" },
    { value: "pending", label: "Pending" },
  ]

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
    })
  }


  ngOnInit(): void {}

  onSubmit(): void {
    if (this.editForm.valid) {
      this.loading = true
      const formData = this.editForm.value

      this.userService.updateUser(this.data.user.id!, formData).subscribe({
        next: (updatedUser) => {
          this.loading = false
          this.snackBar.open("User updated successfully", "Close", { duration: 3000 })
          this.dialogRef.close(updatedUser)
        },
        error: (error) => {
          this.loading = false
          console.error("Error updating user:", error)
          this.snackBar.open("Failed to update user", "Close", { duration: 5000 })
        },
      })
    }
  }

  onCancel(): void {
    this.dialogRef.close()
  }
}
