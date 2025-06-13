import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';
import { filter, take } from 'rxjs/operators';

declare var Razorpay: any;

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: false
})
export class RegisterComponent {}
// implements OnInit {
//   isAuthenticated = false;
//   paymentDone = false;

//   constructor(
//     public auth: AuthService,
//     private router: Router
//   ) {}

//   ngOnInit(): void {
    
//     this.auth.isAuthenticated$.pipe(
//       filter(val => val !== null), 
//       take(1) 
//     ).subscribe(auth => {
//       this.isAuthenticated = auth;
//       this.checkPaymentStatus();
//     });

    
//     this.auth.isAuthenticated$.subscribe(auth => {
//       this.isAuthenticated = auth;
//       this.checkPaymentStatus();
//     });
//   }

//   private checkPaymentStatus(): void {
//     if (this.isAuthenticated) {
//       const paid = localStorage.getItem('payment_done');
//       if (paid === 'true') {
//         this.paymentDone = true;
//         this.router.navigate(['/dashboard']);
//       }
//     }
//   }

  
//   login(): void {
//     this.auth.loginWithRedirect();
//   }

//   signup(): void {
//     this.auth.loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } });
//   }

//   payNow(): void {
//     const options = {
//       key: '',
//       amount: 30000,
//       currency: 'INR',
//       name: 'Professionals Solidarity Forum',
//       description: 'Registration Payment',
//       handler: (response: any) => {
//         localStorage.setItem('payment_done', 'true');
//         this.paymentDone = true;
//         this.router.navigate(['/dashboard']);
//       },
//       prefill: {
//         name: '',
//         email: '',
//         contact: ''
//       },
//       theme: { color: '#3399cc' }
//     };
//     const rzp = new Razorpay(options);
//     rzp.open();
//   }

//   logout(): void {
//     this.auth.logout({ logoutParams: { returnTo: window.location.origin } });
//   }
// }