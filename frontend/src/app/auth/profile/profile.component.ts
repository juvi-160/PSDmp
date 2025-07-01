import { Component,  OnInit } from "@angular/core"
import {  FormBuilder,  FormGroup, Validators } from "@angular/forms"
import  { MatSnackBar } from "@angular/material/snack-bar"
import  { MatChipInputEvent } from "@angular/material/chips"
import { COMMA, ENTER } from "@angular/cdk/keycodes"
import  { ProfileService } from "../../core/services/profile.service"
import  { User, ProfileUpdateData } from "../../core/models/user.model"

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  standalone: false
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup
  user: User | null = null
  loading = false
  saving = false
  error = ""
  ageGroups = [
     { value: "18-25", label: "18-25 years" },
    { value: "26-35", label: "26-35 years" },
    { value: "36-45", label: "36-45 years" },
    { value: "46-55", label: "46-55 years" },
    { value: "56-65", label: "56-65 years" },
    { value: "65+", label: "65+ years" },
  ]

  // Chip input configuration
  readonly separatorKeysCodes = [ENTER, COMMA] as const
  areasOfInterest: string[] = []

  constructor(
   private formBuilder: FormBuilder,
    private profileService: ProfileService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
   this.initForm()
    this.loadProfile()
  }

  initForm(): void {
    this.profileForm = this.formBuilder.group({
      name: [{ value: "", disabled: true }], // Non-editable
      email: [{ value: "", disabled: true }], // Non-editable
      phone: ["", [Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      ageGroup: [""],
      profession: ["", [Validators.maxLength(100)]],
      city: ["", [Validators.maxLength(50)]],
      whyPsf: ["", [Validators.maxLength(500)]],
    })
  }

  loadProfile(): void {
      this.loading = true
    this.error = ""

    this.profileService.getUserProfile().subscribe({
      next: (user) => {
        this.user = user
        this.areasOfInterest = user.areasOfInterest || []

        // Populate form with user data
        this.profileForm.patchValue({
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          ageGroup: user.ageGroup || "",
          profession: user.profession || "",
          city: user.city || "",
          whyPsf: user.whyPsf || "",
        })

        this.loading = false
      },
        error: (error) => {
        this.error = "Failed to load profile. Please try again."
        this.loading = false
        console.error("Error loading profile:", error)
      },
    })
  }

  onSubmit(): void {
     if (this.profileForm.invalid) {
      return
    }

    this.saving = true

    const profileData: ProfileUpdateData = {
      phone: this.profileForm.get("phone")?.value || undefined,
      ageGroup: this.profileForm.get("ageGroup")?.value || undefined,
      profession: this.profileForm.get("profession")?.value || undefined,
      city: this.profileForm.get("city")?.value || undefined,
      areasOfInterest: this.areasOfInterest.length > 0 ? this.areasOfInterest : undefined,
      whyPsf: this.profileForm.get("whyPsf")?.value || undefined,
    }

    this.profileService.updateUserProfile(profileData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser
        this.saving = false
        this.snackBar.open("Profile updated successfully!", "Close", { duration: 3000 })
      },
 error: (error) => {
        this.saving = false
        console.error("Error updating profile:", error)
        this.snackBar.open("Failed to update profile. Please try again.", "Close", { duration: 5000 })
      },
    })
  }
 // Chip input methods for areas of interest
  addInterest(event: MatChipInputEvent): void {
    const value = (event.value || "").trim()
    if (value && !this.areasOfInterest.includes(value)) {
      this.areasOfInterest.push(value)
    }
     // Clear the input value
    event.chipInput!.clear()
  }

  removeInterest(interest: string): void {
  const index = this.areasOfInterest.indexOf(interest)
  if (index >= 0) {
    this.areasOfInterest.splice(index, 1)
  }
}

  getProfileCompletionPercentage(): number {
     if (!this.user) return 0

    const fields = [
      this.user.phone,
      this.user.ageGroup,
      this.user.profession,
      this.user.city,
      this.user.areasOfInterest?.length,
      this.user.whyPsf,
    ]

    const completedFields = fields.filter((field) => field).length
    return Math.round((completedFields / fields.length) * 100)
  }
}
