export interface Ticket {
  id: number;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: "general" | "payment" | "technical" | "membership" | "events" | "other";
  user: {           // Add user property to hold user details
    name: string;
    email: string;
  };
  adminEmail?: string;
  adminName?: string;
  adminResponse?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  responses?: TicketResponse[];
}


export interface TicketResponse {
  id: number
  message: string
  isAdminResponse: boolean
  responderEmail: string
  responderName: string
  createdAt: Date
}

export interface CreateTicketRequest {
  subject: string;
  description: string;
  priority?: "low" | "medium" | "high" | "urgent";
  category?: "general" | "payment" | "technical" | "membership" | "events" | "other";
  userName?: string;  // Add userName as optional
  userEmail?: string; // Add userEmail as optional
}


export interface TicketFilter {
  status?: string
  priority?: string
  category?: string
  search?: string
  page?: number
  limit?: number
}

export interface TicketStats {
  total: number
  recent: number
  byStatus: { [key: string]: number }
  byPriority: { [key: string]: number }
}

export interface PaginatedTickets {
  tickets: Ticket[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
