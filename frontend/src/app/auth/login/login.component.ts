import { Component,  OnInit } from "@angular/core"
import {  FormBuilder,  FormGroup, Validators } from "@angular/forms"
import  { Router, ActivatedRoute } from "@angular/router"
import  { AuthService } from "../../core/services/auth.service"
import  { MatSnackBar } from "@angular/material/snack-bar"

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent{}
//  implements OnInit {
//   loginForm!: FormGroup
//   loading = false
//   hidePassword = true
//   returnUrl = "/"

//   constructor(
//     private formBuilder: FormBuilder,
//     private route: ActivatedRoute,
//     private router: Router,
//     private authService: AuthService,
//     private snackBar: MatSnackBar,
//   ) {}

//   ngOnInit(): void {
//     this.loginForm = this.formBuilder.group({
//       email: ["", [Validators.required, Validators.email]],
//       password: ["", [Validators.required, Validators.minLength(6)]],
//     })

    // Get return url from route parameters or default to '/'
//     this.returnUrl = this.route.snapshot.queryParams["returnUrl"] || "/dashboard"
//   }

//   onSubmit(): void {
//     if (this.loginForm.invalid) {
//       return
//     }

//     this.loading = true
//     const { email, password } = this.loginForm.value

//     this.authService.login(email, password).subscribe({
//       next: () => {
//         this.router.navigate([this.returnUrl])
//       },
//       error: (error) => {
//         this.snackBar.open(error.error?.message || "Login failed", "Close", {
//           duration: 5000,
//         })
//         this.loading = false
//       },
//     })
//   }
// }
