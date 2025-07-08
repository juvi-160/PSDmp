import express from "express"
import { checkJwt, logToken, getUserProfile, createUser, verifyPayment, verifyPhone } from "../controllers/authController.js"
import User from "../model/userModel.js" // Fixed import path

const router = express.Router()

// Get user profile
router.get("/profile", checkJwt, logToken, getUserProfile)

// Create new user (protected route)
router.post("/users", checkJwt, logToken, createUser)

// Verify payment and update user role (protected route)
router.post("/payment/verify", checkJwt, logToken, verifyPayment)

router.post("/phone/verify", checkJwt, logToken, verifyPhone)

// Public registration route
router.post("/register", async (req, res) => {
  const { name, email, auth0_id, phone, age_group, profession, city, why_psf } = req.body

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      where: { auth0_id: auth0_id },
    })

    if (existingUser) {
      return res.status(200).json({
        message: "User already exists",
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          auth0_id: existingUser.auth0_id,
        },
      })
    }

    // Create new user
    const newUser = await User.create({
      name,
      email,
      auth0_id,
      phone: phone || null,
      age_group: age_group || null,
      profession: profession || null,
      city: city || null,
      area_of_interests: area_of_interests || null,
      about_you: about_you || null,
      role: "pending",
      profile_completed: false,
    })

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        auth0_id: newUser.auth0_id,
      },
    })
  } catch (err) {
    console.error("Registration error:", err)
    res.status(500).json({ message: "Error registering user", error: err.message })
  }
})

export default router