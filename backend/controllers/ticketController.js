import Ticket from "../model/ticketsModel.js"
import TicketResponse from "../model/ticketResponseModel.js"
import User from "../model/userModel.js"
import { Op } from "sequelize"

// Create a new ticket
export const createTicket = async (req, res) => {
  try {
    const { subject, description, priority, category } = req.body

    // Get Auth0 user ID from token
    const sub = req.auth?.sub || req.auth?.payload?.sub
    if (!sub) {
      console.error("Invalid auth object:", req.auth)
      return res.status(401).json({ message: "Invalid authentication token" })
    }

    console.log("Creating ticket for user with sub:", sub)

    // Validate required fields
    if (!subject || !description) {
      return res.status(400).json({ message: "Subject and description are required" })
    }

    // Get user details from database
    const user = await User.findOne({
      where: { auth0_id: sub },
      attributes: ["name", "email"],
    })

    if (!user) {
      console.error("User not found in database for sub:", sub)
      return res.status(404).json({ message: "User not found" })
    }

    console.log("Found user:", user.name, "with email:", user.email)

    // Create ticket
    const ticket = await Ticket.create({
      user_id: sub,
      subject,
      description,
      priority: priority || "medium",
      category: category || "general",
    })

    console.log("Ticket created with ID:", ticket.id)

    res.status(201).json({
      message: "Ticket created successfully",
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        adminResponse: ticket.admin_response,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        resolvedAt: ticket.resolved_at,
      },
    })
  } catch (error) {
    console.error("Error creating ticket:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get user's tickets
export const getUserTickets = async (req, res) => {
  try {
    // Get Auth0 user ID from token
    const sub = req.auth?.sub || req.auth?.payload?.sub
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" })
    }

    const { status, page = 1, limit = 10 } = req.query

    const whereClause = { user_id: sub }
    if (status) {
      whereClause.status = status
    }

    const offset = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    const { count, rows: tickets } = await Ticket.findAndCountAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
      limit: Number.parseInt(limit),
      offset: offset,
    })

    const formattedTickets = tickets.map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      adminResponse: ticket.admin_response,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      resolvedAt: ticket.resolved_at,
    }))

    res.status(200).json({
      tickets: formattedTickets,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / Number.parseInt(limit)),
      },
    })
  } catch (error) {
    console.error("Error getting user tickets:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get all tickets (Admin only)
export const getAllTickets = async (req, res) => {
  try {
    // Get Auth0 user ID from token
    const sub = req.auth?.sub || req.auth?.payload?.sub
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" })
    }

    // Check if user has admin role
    const user = await User.findOne({
      where: { auth0_id: sub },
      attributes: ["role"],
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized: Admin access required" })
    }

    const { status, priority, category, search, page = 1, limit = 10 } = req.query

    const whereClause = {}

    if (status) whereClause.status = status
    if (priority) whereClause.priority = priority
    if (category) whereClause.category = category

    if (search) {
      whereClause[Op.or] = [{ subject: { [Op.like]: `%${search}%` } }, { description: { [Op.like]: `%${search}%` } }]
    }

    const offset = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    const { count, rows: tickets } = await Ticket.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: Number.parseInt(limit),
      offset: offset,
    })

    const formattedTickets = tickets.map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      userName: ticket.user?.name,
      userEmail: ticket.user?.email,
      adminResponse: ticket.admin_response,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      resolvedAt: ticket.resolved_at,
    }))

    res.status(200).json({
      tickets: formattedTickets,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / Number.parseInt(limit)),
      },
    })
  } catch (error) {
    console.error("Error getting all tickets:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get ticket by ID
export const getTicketById = async (req, res) => {
  try {
    const ticketId = req.params.id

    // Get Auth0 user ID from token
    const sub = req.auth?.sub || req.auth?.payload?.sub
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" })
    }

    // Get user details from database
    const user = await User.findOne({
      where: { auth0_id: sub },
      attributes: ["email", "role"],
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const whereClause = { id: ticketId }

    // Non-admin users can only view their own tickets
    if (user.role !== "admin") {
      whereClause.user_id = sub
    }

    const ticket = await Ticket.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name", "email"],
        },
        {
          model: TicketResponse,
          as: "responses",
          order: [["created_at", "ASC"]],
        },
      ],
    })

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" })
    }

    const formattedTicket = {
      id: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      userName: ticket.user?.name,
      userEmail: ticket.user?.email,
      adminResponse: ticket.admin_response,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      resolvedAt: ticket.resolved_at,
      responses: ticket.responses?.map((response) => ({
        id: response.id,
        message: response.message,
        isAdminResponse: response.is_admin_response,
        createdAt: response.created_at,
      })),
    }

    res.status(200).json(formattedTicket)
  } catch (error) {
    console.error("Error getting ticket by ID:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Update ticket (Admin only)
export const updateTicket = async (req, res) => {
  try {
    const ticketId = req.params.id
    const { status, priority, adminResponse } = req.body

    // Get Auth0 user ID from token
    const sub = req.auth?.sub || req.auth?.payload?.sub
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" })
    }

    // Get admin details from database
    const user = await User.findOne({
      where: { auth0_id: sub },
      attributes: ["name", "email", "role"],
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized: Admin access required" })
    }

    // Check if ticket exists
    const ticket = await Ticket.findByPk(ticketId)

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" })
    }

    // Prepare update data
    const updateData = {}
    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (adminResponse) updateData.admin_response = adminResponse

    if (status === "resolved" || status === "closed") {
      updateData.resolved_at = new Date()
    }

    // Update ticket
    await ticket.update(updateData)

    // Add admin response to ticket_responses if provided
    if (adminResponse) {
      await TicketResponse.create({
        ticket_id: ticketId,
        user_id: sub,
        message: adminResponse,
        is_admin_response: true,
      })
    }

    // Reload ticket to get updated data
    await ticket.reload()

    res.status(200).json({
      message: "Ticket updated successfully",
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        adminResponse: ticket.admin_response,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        resolvedAt: ticket.resolved_at,
      },
    })
  } catch (error) {
    console.error("Error updating ticket:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Add response to ticket
export const addTicketResponse = async (req, res) => {
  try {
    const ticketId = req.params.id
    const { message } = req.body

    // Get Auth0 user ID from token
    const sub = req.auth?.sub || req.auth?.payload?.sub
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" })
    }

    // Get user details from database
    const user = await User.findOne({
      where: { auth0_id: sub },
      attributes: ["name", "email", "role"],
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (!message) {
      return res.status(400).json({ message: "Message is required" })
    }

    // Check if ticket exists and user has access
    const whereClause = { id: ticketId }

    if (user.role !== "admin") {
      whereClause.user_id = sub
    }

    const ticket = await Ticket.findOne({ where: whereClause })

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" })
    }

    // Add response
    await TicketResponse.create({
      ticket_id: ticketId,
      user_id: sub,
      message,
      is_admin_response: user.role === "admin",
    })

    // Update ticket status if it was resolved/closed and user is responding
    if (user.role !== "admin" && (ticket.status === "resolved" || ticket.status === "closed")) {
      await ticket.update({ status: "open" })
    }

    res.status(201).json({ message: "Response added successfully" })
  } catch (error) {
    console.error("Error adding ticket response:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get ticket statistics (Admin only)
export const getTicketStats = async (req, res) => {
  try {
    // Get Auth0 user ID from token
    const sub = req.auth?.sub || req.auth?.payload?.sub
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" })
    }

    // Check if user has admin role
    const user = await User.findOne({
      where: { auth0_id: sub },
      attributes: ["role"],
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized: Admin access required" })
    }

    // Get total tickets
    const totalTickets = await Ticket.count()

    // Get tickets by status
    const statusCounts = await Ticket.findAll({
      attributes: ["status", [Ticket.sequelize.fn("COUNT", "*"), "count"]],
      group: ["status"],
      raw: true,
    })

    // Get tickets by priority
    const priorityCounts = await Ticket.findAll({
      attributes: ["priority", [Ticket.sequelize.fn("COUNT", "*"), "count"]],
      group: ["priority"],
      raw: true,
    })

    // Get recent tickets (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentTickets = await Ticket.count({
      where: {
        created_at: {
          [Op.gte]: sevenDaysAgo,
        },
      },
    })

    const stats = {
      total: totalTickets,
      recent: recentTickets,
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = Number.parseInt(item.count)
        return acc
      }, {}),
      byPriority: priorityCounts.reduce((acc, item) => {
        acc[item.priority] = Number.parseInt(item.count)
        return acc
      }, {}),
    }

    res.status(200).json(stats)
  } catch (error) {
    console.error("Error getting ticket stats:", error)
    res.status(500).json({ message: "Server error" })
  }
}
