import express from "express"
// import { checkJwt } from "../controllers/authController.js"
import {
  getUsers,
  getUserById,
  updateUser,
  exportUsersToExcel,
  getUserStats,
  updateUserRole,
  deleteUser,
  getUserPaymentHistory,
} from "../controllers/userController.js"
import {
  getEventRsvps,
  getEventRsvpStats,
  exportEventRsvpsToExcel,
  updateRsvpStatus,
  getEventsWithRsvpCounts,
} from "../controllers/adminController.js"

const router = express.Router()

// Apply auth middleware to all admin routes
// router.use(checkJwt)

// User management routes
router.get("/users", getUsers)
router.get("/users/export", exportUsersToExcel)
router.get("/users/stats", getUserStats)
router.get("/users/:id", getUserById)
router.get("/users/:id/payment-history", getUserPaymentHistory)
router.put("/users/:id", updateUser)
router.put("/users/:id/role", updateUserRole)
router.delete("/users/:id", deleteUser)

// Event RSVP management routes
router.get("/events/rsvps", getEventRsvps)
router.get("/events/rsvps/export", exportEventRsvpsToExcel)
router.get("/events/:eventId/rsvps/stats", getEventRsvpStats)
router.put("/events/rsvps/:rsvpId", updateRsvpStatus) // Fixed route path
router.get("/events/with-rsvp-counts", getEventsWithRsvpCounts)

export default router
