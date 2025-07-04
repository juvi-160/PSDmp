import { Component, OnInit, Inject } from '@angular/core';
import { FeedbackService } from '../../../core/services/feedback.service';
import { EventFeedback } from '../../../core/services/rsvp.service';

@Component({
  selector: 'app-feedback',
  standalone: false,
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css'],
})
export class FeedbackComponent implements OnInit {
  feedback: EventFeedback[] = [];
  loading: boolean = false;
  error: string | null = null;
  eventId: number = 1;  // You can dynamically set this or get from route params

  constructor(private feedbackService: FeedbackService) {}

  ngOnInit(): void {
    this.loadFeedback();
  }

  loadFeedback(): void {
    this.loading = true;
    this.error = null;

    this.feedbackService.getEventFeedback(this.eventId).subscribe({
      next: (data) => {
        this.feedback = data.map((feedbackItem: any) => ({
          eventId: feedbackItem.event.id,
          eventName: feedbackItem.event.name,
          userName: feedbackItem.user.name,
          userEmail: feedbackItem.user.email,
          rating: feedbackItem.rating,
          comments: feedbackItem.comments || 'No comments provided',
        }));
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load feedback. Please try again later.';
        this.loading = false;
      }
    });
  }

  retryLoadFeedback(): void {
    this.loadFeedback();
  }
}
