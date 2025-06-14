import models from "../model/index.js";
const { Event, EventRSVP, EventFeedback, User } = models;

// RSVP to an event
export const rsvpToEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) return res.status(401).json({ message: "Invalid authentication token" });

    console.log(`Processing RSVP for event ${eventId} by user ${sub}`);

    const event = await Event.findByPk(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    let user = await User.findOne({ where: { auth0_id: sub } });

    if (!user) {
      console.log(`User ${sub} not found, creating new`);
      user = await User.create({
        auth0_id: sub,
        name: "New User",
        email: `${sub}@placeholder.com`,
        role: "pending",
        has_paid: false,
      });
      console.log(`Created user with ID: ${user.id}`);
    }

    const existingRsvp = await EventRSVP.findOne({
      where: {
        event_id: eventId,
        user_id: user.id, // ✅ Using internal user ID
      },
    });

    if (existingRsvp) {
      if (existingRsvp.status === "cancelled") {
        await existingRsvp.update({ status: "confirmed" });
        return res.status(200).json({ message: "RSVP updated to confirmed" });
      }
      return res.status(400).json({ message: "You have already RSVP'd to this event" });
    }

    await EventRSVP.create({
      event_id: eventId,
      user_id: user.id, // ✅
      status: "confirmed",
      feedback_provided: false,
    });

    res.status(201).json({ message: "RSVP successful" });
  } catch (error) {
    console.error("Error in rsvpToEvent:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Cancel RSVP
export const cancelRsvp = async (req, res) => {
  try {
    const { eventId } = req.params;
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) return res.status(401).json({ message: "Invalid authentication token" });

    const user = await User.findOne({ where: { auth0_id: sub } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const rsvp = await EventRSVP.findOne({
      where: {
        event_id: eventId,
        user_id: user.id, // ✅
      },
    });

    if (!rsvp) return res.status(404).json({ message: "RSVP not found" });

    await rsvp.update({ status: "cancelled" });

    res.status(200).json({ message: "RSVP cancelled successfully" });
  } catch (error) {
    console.error("Error in cancelRsvp:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user's RSVPs
export const getUserRsvps = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) return res.status(401).json({ message: "Invalid authentication token" });

    const user = await User.findOne({ where: { auth0_id: sub } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const rsvps = await EventRSVP.findAll({
      where: { user_id: user.id }, // ✅
      include: [
        {
          model: Event,
          as: "event",
          attributes: ["id", "name", "description", "date", "image"],
        },
      ],
      order: [["event", "date", "ASC"]],
    });

    const formattedRsvps = rsvps.map((rsvp) => ({
      rsvpId: rsvp.id,
      status: rsvp.status,
      feedbackProvided: Boolean(rsvp.feedback_provided),
      rsvpDate: rsvp.created_at,
      event: {
        id: rsvp.event.id,
        name: rsvp.event.name,
        description: rsvp.event.description,
        date: rsvp.event.date,
        image: rsvp.event.image ? `${req.protocol}://${req.get("host")}/uploads/events/${rsvp.event.image}` : null,
        isPast: new Date(rsvp.event.date) < new Date(),
      },
    }));

    res.status(200).json(formattedRsvps);
  } catch (error) {
    console.error("Error in getUserRsvps:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user's event statistics
export const getUserEventStats = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) return res.status(401).json({ message: "Invalid authentication token" });

    const user = await User.findOne({ where: { auth0_id: sub } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const rsvps = await EventRSVP.findAll({
      where: { user_id: user.id }, // ✅
      include: [
        {
          model: Event,
          as: "event",
          attributes: ["date"],
        },
      ],
    });

    const stats = {
      upcoming_events: 0,
      attended_events: 0,
      cancelled_events: 0,
      missed_events: 0,
    };

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    rsvps.forEach((rsvp) => {
      const eventDate = new Date(rsvp.event.date);
      eventDate.setHours(0, 0, 0, 0);

      if (rsvp.status === "confirmed" && eventDate >= currentDate) {
        stats.upcoming_events++;
      } else if (rsvp.status === "attended") {
        stats.attended_events++;
      } else if (rsvp.status === "cancelled") {
        stats.cancelled_events++;
      } else if (rsvp.status === "confirmed" && eventDate < currentDate) {
        stats.missed_events++;
      }
    });

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error in getUserEventStats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Mark as attended (Admin only)
export const markAttended = async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) return res.status(401).json({ message: "Invalid authentication token" });

    const user = await User.findOne({ where: { auth0_id: sub }, attributes: ["role"] });
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    const rsvp = await EventRSVP.findOne({
      where: {
        event_id: eventId,
        user_id: userId, // ✅ Already using internal userId
      },
    });

    if (!rsvp) return res.status(404).json({ message: "RSVP not found" });

    await rsvp.update({ status: "attended" });

    res.status(200).json({ message: "Attendance marked successfully" });
  } catch (error) {
    console.error("Error in markAttended:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Submit feedback
export const submitFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comments } = req.body;
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) return res.status(401).json({ message: "Invalid authentication token" });

    const user = await User.findOne({ where: { auth0_id: sub } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const rsvp = await EventRSVP.findOne({
      where: { event_id: eventId, user_id: user.id }, // ✅
    });
    if (!rsvp) return res.status(404).json({ message: "RSVP not found" });

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const existingFeedback = await EventFeedback.findOne({
      where: { event_id: eventId, user_id: user.id },
    });

    if (existingFeedback) {
      await existingFeedback.update({ rating, comments: comments || null });
    } else {
      await EventFeedback.create({
        event_id: eventId,
        user_id: user.id,
        rating,
        comments: comments || null,
      });
    }

    await rsvp.update({ feedback_provided: true });
    res.status(200).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("Error in submitFeedback:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get event feedback
export const getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;

    const feedbacks = await EventFeedback.findAll({
      where: { event_id: eventId },
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
      ],
      order: [["created_at", "DESC"]],
    });

    const formatted = feedbacks.map((fb) => ({
      id: fb.id,
      userId: fb.user_id,
      userName: fb.user.name,
      userEmail: fb.user.email,
      rating: fb.rating,
      comments: fb.comments,
      createdAt: fb.created_at,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error in getEventFeedback:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  rsvpToEvent,
  cancelRsvp,
  getUserRsvps,
  getUserEventStats,
  markAttended,
  submitFeedback,
  getEventFeedback,
};
