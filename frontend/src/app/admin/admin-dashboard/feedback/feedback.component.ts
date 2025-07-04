import { Component, OnInit } from '@angular/core';
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
  averageRating: number = 0;
  feedbackCount: number = 0;
  eventId: number = 1; // You can replace this with a dynamic value from route params

  constructor(private feedbackService: FeedbackService) {}

  ngOnInit(): void {
    this.loadFeedback();
  }

  loadFeedback(): void {
    this.loading = true;
    this.error = null;

    this.feedbackService.getEventFeedback(this.eventId).subscribe({
      next: (response: any) => {
        console.log('📥 Feedback API response:', response);

        const feedbackArray = response.feedback || [];

        this.feedback = feedbackArray.map((feedbackItem: any) => ({
          eventId: this.eventId,
          eventName: feedbackItem.eventName || 'Unknown Event',
          userName: feedbackItem.userName || 'Anonymous',
          userEmail: feedbackItem.userEmail || 'N/A',
          rating: feedbackItem.rating,
          comments: feedbackItem.comments || 'No comments provided',
          createdAt: feedbackItem.createdAt,
        }));

        this.averageRating = response.averageRating || 0;
        this.feedbackCount = response.count || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error loading feedback:', err);
        this.error = 'Failed to load feedback. Please try again later.';
        this.loading = false;
      },
    });
  }

  retryLoadFeedback(): void {
    this.loadFeedback();
  }
}
