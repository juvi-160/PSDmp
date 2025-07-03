import Ticket from "../model/ticketsModel.js";
import TicketResponse from "../model/ticketResponseModel.js";
import User from "../model/userModel.js";
import { Op } from "sequelize";

// CREATE TICKET
export const createTicket = async (req, res) => {
  try {
    const { subject, description, priority, category } = req.body;
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) return res.status(401).json({ message: "Invalid authentication token" });

    if (!subject || !description)
      return res.status(400).json({ message: "Subject and description are required" });

    const user = await User.findOne({
      where: { auth0_id: sub },
      attributes: ["id", "name", "email"]
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🔧 Get the first available admin
    const admin = await User.findOne({ where: { role: "admin" }, attributes: ["id"] });
    if (!admin) return res.status(500).json({ message: "No admin available to assign this ticket" });

    const ticket = await Ticket.create({
      user_id: user.id,
      admin_id: admin.id, // ✅ Assign admin_id
      subject,
      description,
      priority: priority || "medium",
      category: category || "general"
    });

    res.status(201).json({
      message: "Ticket created successfully",
      ticket
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getUserTickets = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) return res.status(401).json({ message: "Invalid authentication token" });

    // ✅ FIXED: Use findOne instead of findAll
    const user = await User.findOne({ where: { auth0_id: sub }, attributes: ["id"] });
    if (!user) return res.status(404).json({ message: "User not found" });

    const { status, page = 1, limit = 10 } = req.query;

    const whereClause = { user_id: user.id };
    if (status) whereClause.status = status;

    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows: tickets } = await Ticket.findAndCountAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
      limit: Number(limit),
      offset
    });

    res.status(200).json({
      tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error("Error getting user tickets:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllTickets = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) return res.status(401).json({ message: "Invalid authentication token" });

    const user = await User.findOne({ where: { auth0_id: sub }, attributes: ["id", "role"] });
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Unauthorized" });

    const { status, priority, category, search, page = 1, limit = 10 } = req.query;
    const whereClause = {};
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (category) whereClause.category = category;
    if (search) {
      whereClause[Op.or] = [
        { subject: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows: tickets } = await Ticket.findAndCountAll({
      where: whereClause,
      include: [{ model: User, as: "user", attributes: ["name", "email"] }],
      order: [["created_at", "DESC"]],
      limit: Number(limit),
      offset
    });

    res.status(200).json({
      tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error("Error getting all tickets:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) return res.status(401).json({ message: "Invalid authentication token" });

    const user = await User.findOne({ where: { auth0_id: sub }, attributes: ["id", "role"] });
    if (!user) return res.status(404).json({ message: "User not found" });

    const whereClause = { id };
    if (user.role !== "admin") whereClause.user_id = user.id;

    const ticket = await Ticket.findOne({
      where: whereClause,
      include: [
        { model: User, as: "user", attributes: ["name", "email"] },
        { model: TicketResponse, as: "responses", order: [["created_at", "ASC"]] }
      ]
    });

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    res.status(200).json(ticket);
  } catch (error) {
    console.error("Error getting ticket by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, adminResponse } = req.body;
    const sub = req.auth?.sub || req.auth?.payload?.sub;

    const user = await User.findOne({ where: { auth0_id: sub }, attributes: ["id", "role"] });
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Unauthorized" });

    const ticket = await Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (adminResponse) updateData.admin_response = adminResponse;
    if (["resolved", "closed"].includes(status)) updateData.resolved_at = new Date();

    await ticket.update(updateData);

    if (adminResponse) {
      await TicketResponse.create({
        ticket_id: id,
        user_id: user.id,
        message: adminResponse,
        is_admin_response: true
      });
    }

    res.status(200).json({ message: "Ticket updated successfully", ticket });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addTicketResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const sub = req.auth?.sub || req.auth?.payload?.sub;

    const user = await User.findOne({ where: { auth0_id: sub }, attributes: ["id", "role"] });
    if (!user) return res.status(404).json({ message: "User not found" });

    const whereClause = { id };
    if (user.role !== "admin") whereClause.user_id = user.id;

    const ticket = await Ticket.findOne({ where: whereClause });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    await TicketResponse.create({
      ticket_id: id,
      user_id: user.id,
      message,
      is_admin_response: user.role === "admin"
    });

    if (user.role !== "admin" && ["resolved", "closed"].includes(ticket.status)) {
      await ticket.update({ status: "open" });
    }

    res.status(201).json({ message: "Response added successfully" });
  } catch (error) {
    console.error("Error adding ticket response:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTicketStats = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    const user = await User.findOne({ where: { auth0_id: sub }, attributes: ["id", "role"] });
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Unauthorized" });

    const total = await Ticket.count();

    const byStatusRaw = await Ticket.findAll({
      attributes: ["status", [Ticket.sequelize.fn("COUNT", "*"), "count"]],
      group: ["status"],
      raw: true
    });

    const byPriorityRaw = await Ticket.findAll({
      attributes: ["priority", [Ticket.sequelize.fn("COUNT", "*"), "count"]],
      group: ["priority"],
      raw: true
    });

    const recent = await Ticket.count({
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const byStatus = {};
    byStatusRaw.forEach((item) => (byStatus[item.status] = Number(item.count)));

    const byPriority = {};
    byPriorityRaw.forEach((item) => (byPriority[item.priority] = Number(item.count)));

    res.status(200).json({ total, recent, byStatus, byPriority });
  } catch (error) {
    console.error("Error getting ticket stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const sub = req.auth?.sub || req.auth?.payload?.sub;

    const user = await User.findOne({ where: { auth0_id: sub }, attributes: ["id", "role"] });
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Unauthorized" });
    const ticket = await Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    await TicketResponse.destroy({ where: { ticket_id: id } });
    await ticket.destroy();
    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export default {
  createTicket,
  getUserTickets,
  getAllTickets,
  getTicketById,
  updateTicket,
  addTicketResponse,
  getTicketStats,
  deleteTicket
};
