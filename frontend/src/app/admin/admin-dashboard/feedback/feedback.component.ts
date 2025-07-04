import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common'; // ✅ CommonModule for *ngIf, *ngFor + DatePipe
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // ✅ For <mat-spinner>
import { FeedbackService } from '../../../core/services/feedback.service';

@Component({
  selector: 'app-event-feedback',
  standalone: true,
  imports: [
    CommonModule,              // ✅ For *ngIf, *ngFor
    MatProgressSpinnerModule   // ✅ For <mat-spinner>
  ],
  providers: [DatePipe],       // ✅ For date pipe to work
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css']
})
export class EventFeedbackComponent implements OnInit {
  eventId!: number;
  feedbackList: any[] = [];
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private feedbackService: FeedbackService
  ) {}

  ngOnInit(): void {
    this.eventId = Number(this.route.snapshot.paramMap.get('eventId'));
    if (this.eventId) {
      this.fetchFeedback();
    } else {
      this.error = 'Invalid event ID';
    }
  }

  fetchFeedback(): void {
    this.loading = true;
    this.feedbackService.getFeedbackByEventId(this.eventId).subscribe({
      next: (data) => {
        this.feedbackList = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load feedback';
        this.loading = false;
        console.error(err);
      }
    });
  }
}
