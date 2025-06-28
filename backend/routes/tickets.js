import express from "express"
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

// Apply auth to all routes
router.use(checkJwt)
router.use(logToken)

// Admin routes (more specific routes first)
router.get("/admin/stats", getTicketStats)

// User routes
router.post("/", createTicket)
router.get("/my-tickets", getUserTickets)
router.get("/all", getAllTickets) // Changed from "/" to "/all" to avoid conflicts
router.get("/:id", getTicketById)
router.put("/:id", updateTicket)
router.post("/:id/responses", addTicketResponse)

export default router
