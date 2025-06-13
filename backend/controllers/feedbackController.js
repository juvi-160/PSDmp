import EventRSVP from "../model/eventFeedbackModel.js"
import EventFeedback from "../model/eventFeedbackModel.js"
import User from "../model/userModel.js"

// Submit feedback for an event
export const submitFeedback = async (req, res) => {
  try {
    const { eventId } = req.params
    const { rating, comments } = req.body

    // Get Auth0 user ID from token
    const sub = req.auth?.sub || req.auth?.payload?.sub
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" })
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" })
    }

    // Check if user attended the event
    const rsvp = await EventRSVP.findOne({
      where: {
        event_id: eventId,
        user_id: sub, // Using auth0_id directly as user_id
      },
    })

    if (!rsvp) {
      return res.status(400).json({ message: "You must RSVP to an event before providing feedback" })
    }

    // Check if feedback already exists
    const existingFeedback = await EventFeedback.findOne({
      where: {
        event_id: eventId,
        user_id: sub, // Using auth0_id directly as user_id
      },
    })

    if (existingFeedback) {
      // Update existing feedback
      await existingFeedback.update({
        rating,
        comments: comments || null,
      })
    } else {
      // Create new feedback
      await EventFeedback.create({
        event_id: eventId,
        user_id: sub, // Using auth0_id directly as user_id
        rating,
        comments: comments || null,
      })
    }

    // Mark that feedback has been provided in the RSVP
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
    const { eventId } = req.params

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

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized: Admin access required" })
    }

    // Get all feedback for the event
    const feedback = await EventFeedback.findAll({
      where: { event_id: eventId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
    })

    // Calculate average rating
    const feedbackData = await EventFeedback.findAll({
      where: { event_id: eventId },
      attributes: ["rating"],
    })

    const averageRating =
      feedbackData.length > 0 ? feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length : 0

    const formattedFeedback = feedback.map((f) => ({
      id: f.id,
      rating: f.rating,
      comments: f.comments,
      createdAt: f.created_at,
      userName: f.user.name,
      userEmail: f.user.email,
    }))

    res.status(200).json({
      feedback: formattedFeedback,
      averageRating,
      count: feedback.length,
    })
  } catch (error) {
    console.error("Error in getEventFeedback:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Export the controller functions
export default {
  submitFeedback,
  getEventFeedback,
}
