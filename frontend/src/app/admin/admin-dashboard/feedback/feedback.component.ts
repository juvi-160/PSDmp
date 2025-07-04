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
  feedback: EventFeedback[] = [];  // Ensure feedback is of type EventFeedback[]
  loading: boolean = false;
  error: string | null = null;

  constructor(private feedbackService: FeedbackService) {}

  ngOnInit(): void {
    this.loadFeedback();
  }

  // Function to load feedback for the event
  loadFeedback(): void {
    this.loading = true;
    this.error = null;

    this.feedbackService.getEventFeedback().subscribe({
      next: (data) => {
        // Assuming 'data' is directly the feedback array
        this.feedback = data.map((feedbackItem: any) => ({
          eventId: feedbackItem.event.id,        // Add eventId here
          eventName: feedbackItem.event.name,    // Include event name
          userName: feedbackItem.user.name,      // Include user name
          userEmail: feedbackItem.user.email,    // Include user email
          rating: feedbackItem.rating,
          comments: feedbackItem.comments || 'No comments provided',  // Handle missing comments
        }));
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load feedback. Please try again later.';
        this.loading = false;
      }
    });
  }

  // Retry loading feedback if an error occurs
  retryLoadFeedback(): void {
    this.loadFeedback();
  }
}
