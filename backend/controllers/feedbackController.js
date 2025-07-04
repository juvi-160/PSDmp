import { Op } from "sequelize";
import EventRSVP from "../model/eventRsvpModel.js";
import Event from "../model/eventsModel.js";
import EventFeedback from "../model/eventFeedbackModel.js";
import User from "../model/userModel.js";

// Submit feedback for an event (still protected)
export const submitFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comments } = req.body;

    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const user = await User.findOne({ where: { auth0_id: sub } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const rsvp = await EventRSVP.findOne({
      where: {
        event_id: eventId,
        user_id: user.id,
      },
    });

    if (!rsvp) {
      return res.status(400).json({
        message: "You must RSVP to an event before providing feedback",
      });
    }

    const existingFeedback = await EventFeedback.findOne({
      where: {
        event_id: eventId,
        user_id: user.id,
      },
    });

    if (existingFeedback) {
      await existingFeedback.update({
        rating,
        comments: comments || null,
      });
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

// ✅ Get feedback for an event (public)
export const getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log("🔓 Public GET /feedback for event:", eventId);

    const feedbackEntries = await EventFeedback.findAll({
      where: { event_id: eventId },
      order: [["created_at", "DESC"]],
    });

    if (!feedbackEntries.length) {
      return res.status(200).json({
        feedback: [],
        averageRating: 0,
        count: 0,
      });
    }

    const userIds = feedbackEntries.map((f) => f.user_id);

    const [users, event] = await Promise.all([
      User.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ["id", "name"],
      }),
      Event.findByPk(eventId, { attributes: ["name"] }),
    ]);

    const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

    const formattedFeedback = feedbackEntries.map((f) => ({
      id: f.id,
      rating: f.rating,
      comments: f.comments,
      createdAt: f.created_at,
      userName: userMap[f.user_id] || "Unknown",
      eventName: event?.name || "Unknown Event",
    }));

    const averageRating =
      feedbackEntries.reduce((sum, f) => sum + f.rating, 0) /
      feedbackEntries.length;

    res.status(200).json({
      feedback: formattedFeedback,
      averageRating,
      count: feedbackEntries.length,
    });
  } catch (error) {
    console.error("❌ Error in getEventFeedback:", {
      message: error.message,
      stack: error.stack,
      full: error,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  submitFeedback,
  getEventFeedback,
};
