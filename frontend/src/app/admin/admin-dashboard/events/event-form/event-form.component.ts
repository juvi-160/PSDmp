import { Component,  OnInit } from "@angular/core"
import {  FormBuilder,  FormGroup, Validators } from "@angular/forms"
import  { ActivatedRoute, Router } from "@angular/router"
import  { MatSnackBar } from "@angular/material/snack-bar"
import { EventService } from "../../../../core/services/event.service"
import { Event as AppEvent } from "../../../../core/models/event.model"; 

@Component({
  selector: 'app-event-form',
  standalone: false,
  templateUrl: './event-form.component.html',
  styleUrl: './event-form.component.css'
})
export class EventFormComponent implements OnInit {
  eventForm!: FormGroup
  isEditMode = false
  eventId: number | null = null
  loading = false
  imagePreview: string | ArrayBuffer | null = null
  imageFile: File | null = null
  today: Date = new Date();
  // Max date for datepicker

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.initForm()

    // Check if we're in edit mode
    this.route.params.subscribe((params) => {
      if (params["id"]) {
        this.isEditMode = true
        this.eventId = +params["id"]
        this.loadEvent(this.eventId)
      }
    })
  }

  initForm(): void {
    this.eventForm = this.fb.group({
      name: ["", [Validators.required, Validators.maxLength(100)]],
      description: ["", [Validators.required]],
      date: [new Date(), [Validators.required]],
      image: [""],
    })
  }

  loadEvent(id: number): void {
    this.loading = true
    this.eventService.getEvent(id).subscribe({
      next: (event: AppEvent) => {
        this.eventForm.patchValue({
          name: event.name,
          description: event.description,
          date: new Date(event.date),
        })

        if (event.image) {
          this.imagePreview = event.image
        }

        this.loading = false
      },
      error: (error) => {
        this.snackBar.open("Failed to load event", "Close", { duration: 5000 })
        this.loading = false
        this.router.navigate(["/admin/events"])
      },
    })
  }

  onImageSelected(event: Event): void { // Event here refers to DOM Event
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.imageFile = fileInput.files[0];
  
      // Preview the selected image
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(this.imageFile);
    }
  }

  removeImage(): void {
    this.imagePreview = null
    this.imageFile = null
    this.eventForm.get("image")?.setValue("")
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      return
    }

    this.loading = true
    const eventData: AppEvent = { // Update type to AppEvent
      name: this.eventForm.value.name,
      description: this.eventForm.value.description,
      date: this.eventForm.value.date,
    };

    if (this.isEditMode && this.eventId) {
      this.eventService.updateEvent(this.eventId, eventData, this.imageFile || undefined).subscribe({
        next: () => {
          this.snackBar.open("Event updated successfully", "Close", { duration: 3000 })
          this.loading = false
          this.router.navigate(["/admin/events"])
        },
        error: (error) => {
          this.snackBar.open("Failed to update event", "Close", { duration: 5000 })
          this.loading = false
        },
      })
    } else {
      this.eventService.createEvent(eventData, this.imageFile || undefined).subscribe({
        next: () => {
          this.snackBar.open("Event created successfully", "Close", { duration: 3000 })
          this.loading = false
          this.router.navigate(["/admin/events"])
        },
        error: (error) => {
          this.snackBar.open("Failed to create event", "Close", { duration: 5000 })
          this.loading = false
        },
      })
    }
  }

  cancel(): void {
    this.router.navigate(["/admin/events"])
  }
}
