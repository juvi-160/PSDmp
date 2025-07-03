import express from "express";
import { getUsers, getUserById, updateUser, exportUsersToExcel, getUserStats, updateUserRole, deleteUser, getUserPaymentHistory } from "../controllers/userController.js";
import { getEventRsvps, getEventRsvpStats, exportEventRsvpsToExcel, updateRsvpStatus, getEventsWithRsvpCounts } from "../controllers/adminController.js";
import User from "../model/userModel.js";  // Make sure to import the User model

const router = express.Router();

// Apply auth middleware to all admin routes
// router.use(checkJwt)

// User management routes
router.get("/users", getUsers);
router.get("/users/export", exportUsersToExcel);
router.get("/users/stats", getUserStats);
router.get("/users/:id", getUserById);
router.get("/users/:id/payment-history", getUserPaymentHistory);
router.put("/users/:id", updateUser);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

// Event RSVP management routes
router.get("/events/rsvps", getEventRsvps);
router.get("/events/rsvps/export", exportEventRsvpsToExcel);
router.get("/events/:eventId/rsvps/stats", getEventRsvpStats);
router.put("/rsvps/:rsvpId", updateRsvpStatus);  // Fixed route path
router.get("/events/with-rsvp-counts", getEventsWithRsvpCounts);

router.get('/check-user-role/:email', async (req, res) => {
  const { email } = req.params; // Get email from URL

  try {
    // Query the Users table to find the user by email
    const user = await User.findOne({ where: { email: email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the user's role
    return res.json({ role: user.role });  // Send back the role (e.g., 'admin', 'individual member', etc.)
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
