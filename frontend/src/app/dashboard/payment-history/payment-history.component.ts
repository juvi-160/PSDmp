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
  subscriptionDetails: any = null;
  subscriptionInvoices: any[] = [];
  subscriptionShortUrl: string = '';
  
  loading = false;
  error = '';
  currentUser: any;
  showPaymentIntegration = false;
  showPaymentHistory = false;
  cancellingAutoPay = false;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private paymentHistoryService: PaymentHistoryService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const email = params['email'];
      const planId = 'plan_Qoz5hfKcbawIHp'; // You can pass this dynamically if needed
      if (email) {
        this.initComponentLogic(email, planId);
      } else {
        this.handleInvalidId();
      }
    });
  }

  initComponentLogic(userEmail: string, planId: string): void {
    this.loading = true;
    this.authService.currentUser.subscribe((user) => {
      if (!user) {
        this.error = 'User not authenticated.';
        this.loading = false;
        return;
      }

      this.currentUser = user;
      this.paymentHistoryService.getPaymentHistory(userEmail).subscribe({
        next: (data: any) => {
          this.paymentHistory = data;
          const isAssociate = user.role === 'associate member';
          const hasPaid = data?.totalPayments > 0;
          this.showPaymentIntegration = isAssociate && !hasPaid;
          this.showPaymentHistory = !isAssociate || hasPaid;

          if (data?.subscriptionId) {
            this.fetchSubscriptionDetails(planId);  // Fetch subscription details using the planId
            this.fetchSubscriptionInvoices(data.subscriptionId);
          }

          this.loading = false;
        },
        error: (error: any) => {
          this.loading = false;
          this.handleError(error);
        }
      });
    });
  }

  fetchSubscriptionDetails(planId: string): void {
    this.paymentHistoryService.getSubscriptionDetails(planId).subscribe({
      next: (response: any) => {
        if (response && response.items && response.items.length > 0) {
          const subscription = response.items[0]; // Get the first subscription item

          this.subscriptionDetails = subscription;
          this.subscriptionShortUrl = subscription.short_url || 'N/A';

          // Format dates (convert timestamp to Date)
          if (subscription.start_at) {
            this.paymentHistory.subscription.startAt = new Date(subscription.start_at * 1000);
          }
          if (subscription.end_at) {
            this.paymentHistory.subscription.endAt = new Date(subscription.end_at * 1000);
          }

          // Other relevant fields
          this.paymentHistory.subscription.status = subscription.status || 'N/A';
          this.paymentHistory.subscription.customAmount = subscription.notes?.customAmount || 'N/A';
          this.paymentHistory.subscription.paymentType = subscription.notes?.paymentType || 'N/A';

          console.log('Subscription Details:', subscription);
        } else {
          this.subscriptionDetails = null;
          console.error('No subscription found in the response');
        }
      },
      error: (error: any) => {
        console.error('Failed to fetch subscription details', error);
      }
    });
  }

  fetchSubscriptionInvoices(subscriptionId: string): void {
    this.paymentHistoryService.getSubscriptionInvoicesById(subscriptionId).subscribe({
      next: (invoices: any[]) => {
        this.subscriptionInvoices = invoices;
        console.log('Subscription Invoices:', invoices);
      },
      error: (error: any) => {
        console.error('Failed to fetch invoices', error);
      }
    });
  }

  enableAutoPay(): void {
    if (!confirm('Are you sure you want to enable AutoPay?')) return;
    this.loading = true;
    this.paymentHistoryService.enableAutoPay().subscribe({
      next: () => {
        this.toast.show('AutoPay enabled successfully', 'success');
        this.paymentHistory.autoPayEnabled = true;
        this.loading = false;
      },
      error: (error: any) => {
        this.toast.show('Failed to enable AutoPay', 'error');
        console.error(error);
        this.loading = false;
      }
    });
  }

  disableAutoPay(): void {
    if (!confirm('Are you sure you want to disable AutoPay?')) return;
    this.loading = true;
    this.paymentHistoryService.disableAutoPay().subscribe({
      next: () => {
        this.toast.show('AutoPay disabled successfully', 'success');
        this.paymentHistory.autoPayEnabled = false;
        this.loading = false;
      },
      error: (error: any) => {
        this.toast.show('Failed to disable AutoPay', 'error');
        console.error(error);
        this.loading = false;
      }
    });
  }

  handleInvalidId(): void {
    this.error = 'Invalid email provided';
    this.toast.show(this.error, 'error');
    console.error(`Payment History Error: ${this.error}`);
  }

  handleError(error: any): void {
    if (error.status) {
      this.error =
        error.status === 404
          ? 'User not found.'
          : error.status === 500
          ? 'Internal Server Error.'
          : `Unexpected error (Status: ${error.status})`;
    } else {
      this.error = 'Network error. Please check your connection.';
    }

    this.toast.show(this.error, 'error');
    console.error('Full Error:', error);
  }
}
