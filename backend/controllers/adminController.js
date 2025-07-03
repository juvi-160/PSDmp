import Event from "../model/eventsModel.js";
import EventRSVP from "../model/eventRsvpModel.js";
import User from "../model/userModel.js";
import ExcelJS from "exceljs";
import { Op } from "sequelize";

// Get all event RSVPs with user details
export const getEventRsvps = async (req, res) => {
  try {
    const whereClause = {};
    const { eventId, status, search, role, dateFrom, dateTo } = req.query;

    // Apply filters
    if (eventId) whereClause.event_id = eventId;
    if (status) whereClause.status = status;

    const includeOptions = [
      {
        model: Event,
        as: "event",
        attributes: ["id", "name", "date"],
      },
      {
        model: User,
        as: "user",
        attributes: ["name", "email", "phone", "role"],
      },
    ];

    // Add search filter to user include
    if (search) {
      includeOptions[1].where = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    if (role) {
      if (includeOptions[1].where) {
        includeOptions[1].where.role = role;
      } else {
        includeOptions[1].where = { role };
      }
    }

    // Add date filters to event include
    if (dateFrom || dateTo) {
      const eventWhere = {};
      if (dateFrom) eventWhere.date = { [Op.gte]: new Date(dateFrom) };
      if (dateTo) {
        if (eventWhere.date) {
          eventWhere.date[Op.lte] = new Date(dateTo);
        } else {
          eventWhere.date = { [Op.lte]: new Date(dateTo) };
        }
      }
      includeOptions[0].where = eventWhere;
    }

    const rsvps = await EventRSVP.findAll({
      where: whereClause,
      include: includeOptions,
      order: [
        ["event", "date", "DESC"],
        ["created_at", "DESC"],
      ],
    });

    // Format the response
    const formattedRsvps = rsvps.map((rsvp) => ({
      id: rsvp.id,
      eventId: rsvp.event_id,
      eventName: rsvp.event.name,
      eventDate: rsvp.event.date,
      userId: rsvp.user_id,
      userName: rsvp.user.name,
      userEmail: rsvp.user.email,
      userPhone: rsvp.user.phone || "Not provided",
      userRole: rsvp.user.role,
      status: rsvp.status,
      feedbackProvided: rsvp.feedback_provided === 1,
      rsvpDate: rsvp.created_at,
    }));

    res.status(200).json(formattedRsvps);
  } catch (error) {
    console.error("Error getting event RSVPs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get event RSVP statistics
export const getEventRsvpStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event exists
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get RSVP counts by status
    const rsvps = await EventRSVP.findAll({
      where: { event_id: eventId },
      attributes: ["status"],
    });

    const stats = {
      confirmed_count: 0,
      cancelled_count: 0,
      attended_count: 0,
      total_count: rsvps.length,
    };

    rsvps.forEach((rsvp) => {
      switch (rsvp.status) {
        case "confirmed":
          stats.confirmed_count++;
          break;
        case "cancelled":
          stats.cancelled_count++;
          break;
        case "attended":
          stats.attended_count++;
          break;
      }
    });

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error getting event RSVP stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Export event RSVPs to Excel
export const exportEventRsvpsToExcel = async (req, res) => {
  try {
    const whereClause = {};
    const { eventId, status, search, role, dateFrom, dateTo } = req.query;

    // Apply filters (same as getEventRsvps)
    if (eventId) whereClause.event_id = eventId;
    if (status) whereClause.status = status;

    const includeOptions = [
      {
        model: Event,
        as: "event",
        attributes: ["id", "name", "date"],
      },
      {
        model: User,
        as: "user",
        attributes: ["name", "email", "phone", "role"],
      },
    ];

    if (search) {
      includeOptions[1].where = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    if (role) {
      if (includeOptions[1].where) {
        includeOptions[1].where.role = role;
      } else {
        includeOptions[1].where = { role };
      }
    }

    if (dateFrom || dateTo) {
      const eventWhere = {};
      if (dateFrom) eventWhere.date = { [Op.gte]: new Date(dateFrom) };
      if (dateTo) {
        if (eventWhere.date) {
          eventWhere.date[Op.lte] = new Date(dateTo);
        } else {
          eventWhere.date = { [Op.lte]: new Date(dateTo) };
        }
      }
      includeOptions[0].where = eventWhere;
    }

    const rsvps = await EventRSVP.findAll({
      where: whereClause,
      include: includeOptions,
      order: [
        ["event", "date", "DESC"],
        ["created_at", "DESC"],
      ],
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Event RSVPs");

    // Add headers
    worksheet.columns = [
      { header: "RSVP ID", key: "rsvp_id", width: 10 },
      { header: "Event ID", key: "event_id", width: 10 },
      { header: "Event Name", key: "event_name", width: 30 },
      { header: "Event Date", key: "event_date", width: 20 },
      { header: "User ID", key: "user_id", width: 40 },
      { header: "User Name", key: "user_name", width: 30 },
      { header: "Email", key: "user_email", width: 30 },
      { header: "Phone", key: "user_phone", width: 20 },
      { header: "Role", key: "user_role", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Feedback Provided", key: "feedback_provided", width: 20 },
      { header: "RSVP Date", key: "rsvp_date", width: 20 },
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add rows
    rsvps.forEach((rsvp) => {
      worksheet.addRow({
        rsvp_id: rsvp.id,
        event_id: rsvp.event_id,
        event_name: rsvp.event.name,
        event_date: new Date(rsvp.event.date).toLocaleString(),
        user_id: rsvp.user_id,
        user_name: rsvp.user.name,
        user_email: rsvp.user.email,
        user_phone: rsvp.user.phone || "Not provided",
        user_role: rsvp.user.role,
        status: rsvp.status,
        feedback_provided: rsvp.feedback_provided ? "Yes" : "No",
        rsvp_date: new Date(rsvp.created_at).toLocaleString(),
      });
    });

    // Set content type and headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=event_rsvps_${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting event RSVPs to Excel:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update RSVP status
export const updateRsvpStatus = async (req, res) => {
  try {
    const { rsvpId } = req.params;
    const { status } = req.body;

    if (!["confirmed", "cancelled", "attended"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be 'confirmed', 'cancelled', or 'attended'",
      });
    }

    console.log("Looking for RSVP with ID:", rsvpId);
    const rsvp = await EventRSVP.findByPk(rsvpId);
    if (!rsvp) {
      return res.status(404).json({ message: "RSVP not found" });
    }

    await rsvp.update({ status });

    return res.status(200).json({ message: "RSVP status updated successfully" });
  } catch (error) {
    console.error("Error updating RSVP status:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all events with RSVP counts
export const getEventsWithRsvpCounts = async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [
        {
          model: EventRSVP,
          as: "rsvps",
          attributes: ["status"],
          required: false,
        },
      ],
      order: [["date", "DESC"]],
    });

    // Format the response
    const formattedEvents = events.map((event) => {
      const rsvpStats = {
        total: event.rsvps.length,
        confirmed: event.rsvps.filter((r) => r.status === "confirmed").length,
        cancelled: event.rsvps.filter((r) => r.status === "cancelled").length,
        attended: event.rsvps.filter((r) => r.status === "attended").length,
      };

      return {
        id: event.id,
        name: event.name,
        description: event.description,
        date: event.date,
        image: event.image
          ? `${req.protocol}://${req.get("host")}/uploads/events/${event.image}`
          : null,
        createdAt: event.created_at,
        updatedAt: event.updated_at,
        rsvpStats,
      };
    });

    res.status(200).json(formattedEvents);
  } catch (error) {
    console.error("Error getting events with RSVP counts:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  getEventRsvps,
  getEventRsvpStats,
  exportEventRsvpsToExcel,
  updateRsvpStatus,
  getEventsWithRsvpCounts,
};
