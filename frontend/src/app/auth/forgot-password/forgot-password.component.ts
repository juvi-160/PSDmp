import { Component,  OnInit } from "@angular/core"
import {  FormBuilder,  FormGroup, Validators } from "@angular/forms"
import  { Router } from "@angular/router"
import  { AuthService } from "../../core/services/auth.service"
import  { MatSnackBar } from "@angular/material/snack-bar"

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent{}
//  implements OnInit {
//   forgotPasswordForm!: FormGroup
//   loading = false

//   constructor(
//     private formBuilder: FormBuilder,
//     private router: Router,
//     private authService: AuthService,
//     private snackBar: MatSnackBar,
//   ) {}

//   ngOnInit(): void {
//     this.forgotPasswordForm = this.formBuilder.group({
//       email: ["", [Validators.required, Validators.email]],
//     })
//   }

//   onSubmit(): void {
//     if (this.forgotPasswordForm.invalid) {
//       return
//     }

//     this.loading = true
//     const email = this.forgotPasswordForm.get("email")?.value

//     this.authService.forgotPassword(email).subscribe({
//       next: (response) => {
//         this.snackBar.open(response.message, "Close", {
//           duration: 5000,
//         })
//         this.router.navigate(["/login"])
//       },
//       error: (error) => {
//         this.snackBar.open(error.error?.message || "Request failed", "Close", {
//           duration: 5000,
//         })
//         this.loading = false
//       },
//     })
//   }
// }