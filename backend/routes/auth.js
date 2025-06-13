import express from "express";
import { checkJwt, logToken, getUserProfile, createUser, verifyPayment } from "../controllers/authController.js";
import { sendWelcomeEmail } from '../utils/mailer.js';
import User from "../model/userModel.js"; // Import the User model

const router = express.Router();

// Get user profile
router.get("/profile", checkJwt, logToken, getUserProfile);

// Create new user (protected route)
router.post("/users", checkJwt, logToken, createUser);

// Verify payment and update user role (protected route)
router.post("/payment/verify", checkJwt, logToken, verifyPayment);

// Public registration route with DB insert + welcome email
router.post('/register', async (req, res) => {
  const { name, email, auth0_id, phone, age_group, profession, city, why_psf } = req.body;

  try {
    // Create new user using Sequelize model
    const newUser = await User.create({
      name,
      email,
      auth0_id,
      phone: phone || null,
      age_group: age_group || null,
      profession: profession || null,
      city: city || null,
      why_psf: why_psf || null,
      role: 'pending',
      profile_completed: false
    });

    // Send welcome email
    await sendWelcomeEmail(email, name);

    res.status(201).json({ 
      message: 'User registered and welcome email sent!', 
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        auth0_id: newUser.auth0_id
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
});

export default router;