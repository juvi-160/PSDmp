import express from "express";
import { auth } from "express-oauth2-jwt-bearer";
import { 
  rsvpToEvent,
  cancelRsvp,
  markAttended,
  getUserRsvps,
  getUserEventStats,
} from "../controllers/rsvpController.js";
import { submitFeedback, getEventFeedback } from "../controllers/feedbackController.js";

const router = express.Router();

// Auth middleware
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: "RS256",
  // Add debug mode to get more information
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

// Debug middleware to log token information
const logToken = (req, res, next) => {
  console.log(
    "Auth headers:",
    req.headers.authorization ? `${req.headers.authorization.substring(0, 20)}...` : "No authorization header",
  )
  console.log("Auth object:", req.auth)
  next()
}

// RSVP routes
router.post("/events/:eventId/rsvp", checkJwt, logToken, rsvpToEvent)
router.put("/events/:eventId/cancel", checkJwt, logToken, cancelRsvp)
router.put("/events/:eventId/users/:userId/attend", checkJwt, logToken, markAttended)
router.get("/my-events", checkJwt, logToken, getUserRsvps)
router.get("/stats", checkJwt, logToken, getUserEventStats)

// Feedback routes
router.post("/events/:eventId/feedback", checkJwt, logToken, submitFeedback)
router.get("/events/:eventId/feedback", checkJwt, logToken, getEventFeedback)

export default router;
