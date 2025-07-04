import EventRSVP from "../model/eventRsvpModel.js"
import EventFeedback from "../model/eventFeedbackModel.js"
import User from "../model/userModel.js"

// Submit feedback for an event
export const submitFeedback = async (req, res) => {
  try {
    const { eventId } = req.params
    const { rating, comments } = req.body

    const sub = req.auth?.sub || req.auth?.payload?.sub
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" })
    }

    // Get user by auth0_id to retrieve internal numeric user_id
    const user = await User.findOne({ where: { auth0_id: sub } })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" })
    }

    // Check RSVP status
    const rsvp = await EventRSVP.findOne({
      where: {
        event_id: eventId,
        user_id: user.id,
      },
    })

    if (!rsvp) {
      return res.status(400).json({
        message: "You must RSVP to an event before providing feedback",
      })
    }

    // Check if feedback already exists
    const existingFeedback = await EventFeedback.findOne({
      where: {
        event_id: eventId,
        user_id: user.id,
      },
    })

    if (existingFeedback) {
      await existingFeedback.update({
        rating,
        comments: comments || null,
      })
    } else {
      await EventFeedback.create({
        event_id: eventId,
        user_id: user.id,
        rating,
        comments: comments || null,
      })
    }

    await rsvp.update({ feedback_provided: true })

    res.status(200).json({ message: "Feedback submitted successfully" })
  } catch (error) {
    console.error("Error in submitFeedback:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get feedback for an event (admin only)
export const getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;

    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const user = await User.findOne({
      where: { auth0_id: sub },
      attributes: ["id", "role"],
    });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    const feedback = await EventFeedback.findAll({
      where: { event_id: eventId },
      include: [
        {
          model: User,
          as: "user", // Including user details (name)
          attributes: ["name"], // Only get the name from the user
        },
        {
          model: Event,
          as: "event", // Including event details (name)
          attributes: ["name"], // Only get the name from the event
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Calculate average rating
    const feedbackData = await EventFeedback.findAll({
      where: { event_id: eventId },
      attributes: ["rating"],
    });

    const averageRating =
      feedbackData.length > 0
        ? feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length
        : 0;

    // Format feedback data
    const formattedFeedback = feedback.map((f) => ({
      id: f.id,
      rating: f.rating,
      comments: f.comments,
      createdAt: f.created_at,
      userName: f.user.name,  // Accessing the user name from the included model
      eventName: f.event.name, // Accessing the event name from the included model
    }));

    res.status(200).json({
      feedback: formattedFeedback,
      averageRating,
      count: feedback.length,
    });
  } catch (error) {
    console.error("Error in getEventFeedback:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  submitFeedback,
  getEventFeedback,
}
