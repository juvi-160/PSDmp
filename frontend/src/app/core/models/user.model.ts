export interface User {
  id?: number
  auth0Id: string
  name: string
  email: string
  phone?: string
  role: "admin" | "individual member" | "associate member" | "pending"
  isEmailVerified: boolean
  isPhoneVerified: boolean
  hasPaid: boolean
  phoneVerificationCode?: string
  createdAt: Date
  updatedAt: Date
  ageGroup?: "18-25" | "26-35" | "36-45" | "46-55" | "56-65" | "65+"
  profession?: string
  city?: string
  areasOfInterest?: string[]
  whyPsf?: string
  profilePicture?: string
  profileCompleted?: boolean
  autoPayEnabled?: boolean
  subscriptionId?: string
  subscriptionStatus?: "active" | "inactive" | "cancelled"
  paymentDetails?: PaymentDetails
  paymentHistory?: PaymentHistory[]
  totalPaymentAmount?: number
  formattedPaymentAmount?: string
}

export interface PaymentDetails {
  orderId: string
  amount: number
  currency: string
  status: "created" | "paid" | "failed"
  paymentId?: string
  paymentDate?: Date
  formattedAmount?: string
}

export interface PaymentHistory {
  id: number
  orderId: string
  amount: number
  currency: string
  status: "created" | "paid" | "failed"
  paymentId?: string
  paymentDate: Date
  formattedAmount: string
  isSubscription: boolean
  subscriptionId?: string
  notes?: any
}

export interface UserFilter {
  search?: string
  role?: string
  paymentStatus?: boolean
  dateFrom?: Date
  dateTo?: Date
}

export interface ProfileUpdateData {
  phone?: string
  ageGroup?: "18-25" | "26-35" | "36-45" | "46-55" | "56-65" | "65+"
  profession?: string
  city?: string
  areasOfInterest?: string[]
  whyPsf?: string
}
