import { Component,  OnInit } from "@angular/core"
import {  FormBuilder,  FormGroup, Validators } from "@angular/forms"
import  { MatSnackBar } from "@angular/material/snack-bar"
import  { Router } from "@angular/router"
import  { TicketService } from "../../core/services/ticket.service"
import  { CreateTicketRequest } from "../../core/models/ticket.model"
import { ToastService } from "../../core/services/toast.service"
@Component({
  selector: 'app-raise-ticket',
  standalone: false,
  templateUrl: './raise-ticket.component.html',
  styleUrl: './raise-ticket.component.css'
})
export class RaiseTicketComponent implements OnInit {
  ticketForm: FormGroup
  loading = false

  priorities = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ]

  categories = [
    { value: "general", label: "General Inquiry" },
    { value: "payment", label: "Payment Issue" },
    { value: "technical", label: "Technical Support" },
    { value: "membership", label: "Membership" },
    { value: "events", label: "Events" },
    { value: "other", label: "Other" },
  ]

  constructor(
    private formBuilder: FormBuilder,
    private ticketService: TicketService,
    private snackBar: MatSnackBar,
    private router: Router,
    private toast: ToastService
  ) {
    this.ticketForm = this.formBuilder.group({
      subject: ["", [Validators.required, Validators.minLength(5), Validators.maxLength(255)]],
      description: ["", [Validators.required, Validators.minLength(10)]],
      priority: ["medium", Validators.required],
      category: ["general", Validators.required],
    })
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.ticketForm.valid) {
      this.loading = true

      const ticketData: CreateTicketRequest = {
        subject: this.ticketForm.get("subject")?.value,
        description: this.ticketForm.get("description")?.value,
        priority: this.ticketForm.get("priority")?.value,
        category: this.ticketForm.get("category")?.value,
      }

      this.ticketService.createTicket(ticketData).subscribe({
        next: (response) => {
          this.loading = false
          //this.snackBar.open("Ticket created successfully!", "Close", { duration: 3000 })
          this.toast.show("Ticket created successfully!", "success")
          this.router.navigate(["/dashboard/my-tickets"])
        },
        error: (error) => {
          this.loading = false
          console.error("Error creating ticket:", error)
          //this.snackBar.open("Failed to create ticket. Please try again.", "Close", { duration: 5000 })
          this.toast.show("Failed to create ticket. Please try again.", "error")
        },
      })
    } else {
      this.markFormGroupTouched()
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.ticketForm.controls).forEach((key) => {
      const control = this.ticketForm.get(key)
      control?.markAsTouched()
    })
  }

  getErrorMessage(fieldName: string): string {
    const control = this.ticketForm.get(fieldName)

    if (control?.hasError("required")) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`
    }

    if (control?.hasError("minlength")) {
      const minLength = control.errors?.["minlength"]?.requiredLength
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${minLength} characters`
    }

    if (control?.hasError("maxlength")) {
      const maxLength = control.errors?.["maxlength"]?.requiredLength
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must not exceed ${maxLength} characters`
    }

    return ""
  }
}
