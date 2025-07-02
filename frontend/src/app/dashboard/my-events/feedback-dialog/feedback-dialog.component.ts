import { Component, Inject } from "@angular/core"
import {  FormBuilder,  FormGroup, Validators } from "@angular/forms"
import {  MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog"
import  { MatSnackBar } from "@angular/material/snack-bar"
import  { RsvpService } from "../../../core/services/rsvp.service"
import { ToastService } from "../../../core/services/toast.service"

interface FeedbackDialogData {
  eventId: number
  eventName: string
}

@Component({
  selector: 'app-feedback-dialog',
  standalone: false,
  templateUrl: './feedback-dialog.component.html',
  styleUrl: './feedback-dialog.component.css'
})
export class FeedbackDialogComponent {
  feedbackForm: FormGroup
  loading = false;

  constructor(
    private fb: FormBuilder,
    private rsvpService: RsvpService,
    private snackBar: MatSnackBar,
    private toast: ToastService,
    public dialogRef: MatDialogRef<FeedbackDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FeedbackDialogData
  ) {
    this.feedbackForm = this.fb.group({
      rating: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
      comments: ["", [Validators.maxLength(500)]],
    });
  }

  onSubmit(): void {
    if (this.feedbackForm.invalid) {
      return
    }

    this.loading = true
    const feedback = {
      eventId: this.data.eventId,
      rating: this.feedbackForm.value.rating,
      comments: this.feedbackForm.value.comments,
    }

    this.rsvpService.submitFeedback(this.data.eventId, feedback).subscribe({
      next: () => {
        this.toast.show("Thank you for your feedback!", "success");
        this.dialogRef.close(true);
        this.loading = false;
      },
      error: (error) => {
        console.error("Error submitting feedback:", error)
        //this.snackBar.open("Failed to submit feedback", "Close", { duration: 3000 })
        this.toast.show("Failed to submit feedback. Please try again.", "error");
        this.loading = false
      },
    })
  }

  onCancel(): void {
    this.dialogRef.close(false)
  }
}
