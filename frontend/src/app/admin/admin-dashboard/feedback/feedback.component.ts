import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RsvpService } from '../../../core/services/rsvp.service';  // Import the rsvp service

@Component({
  selector: 'app-feedback',
  standalone: false,
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css'
})
export class FeedbackComponent implements OnInit {
  feedback: any[] = [];
  eventId: number | null = null;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private rsvpService: RsvpService // Inject the RsvpService
  ) {}

  ngOnInit(): void {
    // Get event ID from route params
    this.route.params.subscribe((params) => {
      this.eventId = +params['eventId']; // Ensure it's a number
      if (this.eventId) {
        this.loadFeedback();
      }
    });
  }

  loadFeedback(): void {
    // Use the rsvp service to fetch feedback for the event
    this.rsvpService.getFeedbackForEvent(this.eventId!).subscribe(
      (data) => {
        this.feedback = data; // Store feedback data
      },
      (error) => {
        this.error = 'Error loading feedback. Please try again later.';
      }
    );
  }
}