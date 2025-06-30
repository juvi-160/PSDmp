import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentHistoryService } from '../../core/services/payment-history.service';

@Component({
  selector: 'app-payment-history',
  standalone: false,
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.css']
})
export class PaymentHistoryComponent implements OnInit {
  userId: string | null = null;
  paymentHistory: any = {}; // Holds payment and subscription data
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentHistoryService: PaymentHistoryService, // Service for fetching data
    private snackBar: MatSnackBar
  ) {}

 ngOnInit(): void {
  this.route.params.subscribe((params) => {
  const id = params['id'];
  console.log('Extracted User ID:', id);

  if (id) {
    this.userId = id;
    this.loadPaymentHistory();
  } else {
    this.handleInvalidId();
  }
});

}


  loadPaymentHistory(): void {
    if (!this.userId) {
      this.handleInvalidId();
      return;
    }

    this.loading = true;
    this.paymentHistoryService.getPaymentHistory(this.userId).subscribe({
      next: (data) => {
        this.paymentHistory = data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.handleError(error);  // Handle error more extensively
      },
    });
  }

  handleInvalidId(): void {
    this.error = 'Invalid user ID provided';
    this.snackBar.open(this.error, 'Dismiss', { duration: 5000 });
    console.error(`Payment History Error: ${this.error}`);
  }

  handleError(error: any): void {
    // Detailed logging of the error
    if (error.status) {
      // Network or server-side error (HTTP error)
      console.error(`HTTP Error - Status: ${error.status}, Message: ${error.message}`);
      if (error.status === 404) {
        this.error = 'User not found. Please verify the user ID.';
      } else if (error.status === 500) {
        this.error = 'Internal Server Error. Please try again later.';
      } else {
        this.error = `Unexpected error occurred (Status: ${error.status})`;
      }
    } else {
      // Network error, may indicate no internet or other connection issues
      console.error('Network error:', error);
      this.error = 'Network error. Please check your internet connection.';
    }

    // Show a snackbar to the user
    this.snackBar.open(this.error, 'Dismiss', { duration: 5000 });

    // For developers, log the full error to console
    console.error('Full Error Details:', error);
  }
}
