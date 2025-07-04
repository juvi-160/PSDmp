import express from "express"
import { auth } from "express-oauth2-jwt-bearer"
import {
  rsvpToEvent,
  cancelRsvp,
  markAttended,
  getUserRsvps,
  getUserEventStats,
  // updateRsvpStatus
} from "../controllers/rsvpController.js"
import { submitFeedback, getEventFeedback } from "../controllers/feedbackController.js"
import dotenv from "dotenv"
dotenv.config()

const router = express.Router()

// Auth middleware
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: "RS256",
  errorHandler: (err, req, res, next) => {
    console.error("Auth0 middleware error:", err)
    res.status(err.status || 500).json({
      message: err.message,
      code: err.code,
      statusCode: err.status,
      error: err.error,
    })
  },
})

// Debug middleware
const logToken = (req, res, next) => {
  console.log(
    "Auth headers:",
    req.headers.authorization ? `${req.headers.authorization.substring(0, 20)}...` : "No authorization header",
  )
  console.log("Auth object:", req.auth)
  next()
}

router.get('/events/:eventId/feedback', async (req, res) => {
  const { eventId } = req.params;

  try {
    // Fetch feedback from the database for the given event ID
    const feedback = await EventFeedback.findAll({
      where: { eventId },
      include: [{ model: User, attributes: ['email'] }],
    });

    if (!feedback.length) {
      return res.status(404).json({ message: 'No feedback found for this event' });
    }

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching event feedback:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// RSVP routes - Fixed parameter syntax
router.post("/events/:eventId/rsvp", checkJwt, logToken, rsvpToEvent)
router.put("/events/:eventId/cancel", checkJwt, logToken, cancelRsvp)
// router.put('/rsvps/:rsvpId',checkJwt, logToken, updateRsvpStatus);
// Fixed: Split the complex route into a simpler one
router.put("/events/:eventId/attend/:userId", checkJwt, logToken, markAttended)
router.get("/my-events", checkJwt, logToken, getUserRsvps)
router.get("/stats", checkJwt, logToken, getUserEventStats)

// Feedback routes
router.post("/events/:eventId/feedback", checkJwt, logToken, submitFeedback)
router.get("/events/:eventId/feedback", checkJwt, logToken, getEventFeedback)

export default router