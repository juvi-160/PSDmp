import { Component, Inject } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { RsvpService } from "../../../core/services/rsvp.service";
import { ToastService } from "../../../core/services/toast.service";
import { AuthService } from "../../../core/services/auth.service";

interface FeedbackDialogData {
  eventId: number;
  eventName: string;
}

@Component({
  selector: 'app-feedback-dialog',
  standalone: false,
  templateUrl: './feedback-dialog.component.html',
  styleUrls: ['./feedback-dialog.component.css'],
})
export class FeedbackDialogComponent {
  feedbackForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private rsvpService: RsvpService,
    private snackBar: MatSnackBar,
    private toast: ToastService,
    public dialogRef: MatDialogRef<FeedbackDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FeedbackDialogData,
    private authService: AuthService  // Injecting auth service to get user info
  ) {
    this.feedbackForm = this.fb.group({
      rating: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
      comments: ["", [Validators.maxLength(500)]],
    });
  }

  onSubmit(): void {
    if (this.feedbackForm.invalid) {
      return;
    }

    this.loading = true;

    // Collecting user and event feedback data
    const feedback = {
      eventId: this.data.eventId,
      rating: this.feedbackForm.value.rating,
      comments: this.feedbackForm.value.comments,
      userName: this.authService.getUserName(),  // Replace with your actual user fetching logic
      userEmail: this.authService.getUserEmail(),  // Replace with your actual user fetching logic
      eventName: this.data.eventName,
    };

    this.rsvpService.submitFeedback(this.data.eventId, feedback).subscribe({
      next: () => {
        this.toast.show("Thank you for your feedback!", "success");
        this.dialogRef.close(true);
        this.loading = false;
      },
      error: (error) => {
        console.error("Error submitting feedback:", error);
        this.toast.show("Failed to submit feedback. Please try again.", "error");
        this.loading = false;
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
