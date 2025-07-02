import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentHistoryService } from '../../core/services/payment-history.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-payment-history',
  standalone: false,
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.css']
})
export class PaymentHistoryComponent implements OnInit {
  userId: string | null = null;
  paymentHistory: any = {};
  loading = false;
  error = '';
  currentUser: any;
  showPaymentIntegration = false;
  showPaymentHistory = false;
  cancellingAutoPay = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentHistoryService: PaymentHistoryService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.userId = id;
        this.initComponentLogic();
      } else {
        this.handleInvalidId();
      }
    });
  }

  initComponentLogic(): void {
    this.loading = true;

    // Get current user
    this.authService.currentUser.subscribe((user) => {
      if (!user) {
        this.error = 'User not authenticated.';
        this.loading = false;
        return;
      }

      this.currentUser = user;

      this.paymentHistoryService.getPaymentHistory(this.userId!).subscribe({
        next: (data) => {
          this.paymentHistory = data;

          // Conditions
          const isAssociate = user.role === 'associate member';
          const hasPaid = data?.totalPayments > 0;

          if (isAssociate && !hasPaid) {
            this.showPaymentIntegration = true;
            this.showPaymentHistory = false;
          } else {
            this.showPaymentIntegration = false;
            this.showPaymentHistory = true;
          }

          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.handleError(error);
        },
      });
    });
  }

  cancelAutoPay(): void {
    if (!confirm('Are you sure you want to cancel AutoPay?')) return;

    this.cancellingAutoPay = true;

  }

  handleInvalidId(): void {
    this.error = 'Invalid user ID provided';
    this.toast.show(this.error, 'error');
    console.error(`Payment History Error: ${this.error}`);
  }

  handleError(error: any): void {
    if (error.status) {
      if (error.status === 404) {
        this.error = 'User not found.';
      } else if (error.status === 500) {
        this.error = 'Internal Server Error.';
      } else {
        this.error = `Unexpected error (Status: ${error.status})`;
      }
    } else {
      this.error = 'Network error. Please check your connection.';
    }

    //this.snackBar.open(this.error, 'Dismiss', { duration: 5000 });
    this.toast.show(this.error, 'error');
    console.error('Full Error:', error);
  }
}
