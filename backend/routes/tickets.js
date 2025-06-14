// File: routes/tickets.js
import express from "express"
import dotenv from "dotenv"
dotenv.config() // Load environment variables from .env file
import { auth } from "express-oauth2-jwt-bearer"
import {
  createTicket,
  getUserTickets,
  getAllTickets,
  getTicketById,
  updateTicket,
  addTicketResponse,
  getTicketStats,
} from "../controllers/ticketController.js"

const router = express.Router()

// Auth middleware - EXACTLY matching the working rsvps.js pattern
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

// Debug middleware to log token information
const logToken = (req, res, next) => {
  console.log(
    "Auth headers:",
    req.headers.authorization ? `${req.headers.authorization.substring(0, 20)}...` : "No authorization header",
  )
  console.log("Auth object:", req.auth)
  next()
}

// Fix route order - admin routes with potential path conflicts should come first
// Admin routes
router.get("/admin/stats", checkJwt, logToken, getTicketStats)
router.get("/", checkJwt, logToken, getAllTickets)
router.put("/:id", checkJwt, logToken, updateTicket)

// User routes (authenticated users)
router.post("/", checkJwt, logToken, createTicket)
router.get("/my-tickets", checkJwt, logToken, getUserTickets)
router.get("/:id", checkJwt, logToken, getTicketById)
router.post("/:id/responses", checkJwt, logToken, addTicketResponse)

export default router
