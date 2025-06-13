import User from "../model/userModel.js"
import Order from "../model/orderModel.js"
import { auth } from "express-oauth2-jwt-bearer"
import crypto from "crypto"
import { Op } from "sequelize" // Import Op from sequelize

// Auth0 middleware
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: "RS256",
})

// Debug middleware to log token information
const logToken = (req, res, next) => {
  console.log("Auth headers:", req.headers.authorization)
  console.log("Auth object:", req.auth)
  next()
}

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    // Use req.auth.payload.sub instead of req.auth.sub
    const sub = req.auth?.sub || req.auth?.payload?.sub
    if (!sub) {
      console.error("Invalid auth object:", req.auth)
      return res.status(401).json({ message: "Invalid authentication token" })
    }

    const userId = sub // Auth0 user ID from JWT token
    console.log("Looking up user with Auth0 ID:", userId)

    const user = await User.findOne({
      where: { auth0_id: userId },
    })

    if (!user) {
      console.log("User not found in database")
      return res.status(404).json({ message: "User not found" })
    }

    // Convert snake_case to camelCase for frontend
    const formattedUser = {
      id: user.id,
      auth0Id: user.auth0_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.is_email_verified === 1,
      isPhoneVerified: user.is_phone_verified === 1,
      hasPaid: user.has_paid === 1,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }

    console.log("User found:", formattedUser)
    res.status(200).json(formattedUser)
  } catch (error) {
    console.error("Error getting user profile:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Create new user
const createUser = async (req, res) => {
  try {
    // Use req.auth.payload.sub instead of req.auth.sub
    const sub = req.auth?.sub || req.auth?.payload?.sub
    if (!sub) {
      console.error("Invalid auth object:", req.auth)
      return res.status(401).json({ message: "Invalid authentication token" })
    }

    // Use the Auth0 ID from the token, not from the request body
    const auth0Id = sub
    const { name, email, role } = req.body

    console.log("Creating new user:", { auth0Id, name, email, role })

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ auth0_id: auth0Id }, { email: email }],
      },
    })

    if (existingUser) {
      console.log("User already exists")

      // Return the existing user instead of an error
      const formattedUser = {
        id: existingUser.id,
        auth0Id: existingUser.auth0_id,
        name: existingUser.name,
        email: existingUser.email,
        phone: existingUser.phone,
        role: existingUser.role,
        isEmailVerified: existingUser.is_email_verified === 1,
        isPhoneVerified: existingUser.is_phone_verified === 1,
        hasPaid: existingUser.has_paid === 1,
        createdAt: existingUser.created_at,
        updatedAt: existingUser.updated_at,
      }

      return res.status(200).json(formattedUser)
    }

    // Create new user
    const newUser = await User.create({
      auth0_id: auth0Id,
      name,
      email,
      role: role || "pending",
      has_paid: false,
    })

    console.log("User created with ID:", newUser.id)

    // Convert snake_case to camelCase for frontend
    const formattedUser = {
      id: newUser.id,
      auth0Id: newUser.auth0_id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      isEmailVerified: newUser.is_email_verified === 1,
      isPhoneVerified: newUser.is_phone_verified === 1,
      hasPaid: newUser.has_paid === 1,
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at,
    }

    res.status(201).json(formattedUser)
  } catch (error) {
    console.error("Error creating user:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Verify payment and update user role
const verifyPayment = async (req, res) => {
  try {
    // Use req.auth.payload.sub instead of req.auth.sub
    const sub = req.auth?.sub || req.auth?.payload?.sub
    if (!sub) {
      console.error("Invalid auth object:", req.auth)
      return res.status(401).json({ message: "Invalid authentication token" })
    }

    const userId = sub // Auth0 user ID from JWT token
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body

    // Verify payment signature with Razorpay
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex")

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" })
    }

    // Update order status
    await Order.update(
      {
        status: "paid",
        payment_id: razorpay_payment_id,
      },
      {
        where: { order_id: razorpay_order_id },
      },
    )

    // Update user role and payment status
    await User.update(
      {
        role: "individual member",
        has_paid: true,
      },
      {
        where: { auth0_id: userId },
      },
    )

    // Get the updated user
    const user = await User.findOne({
      where: { auth0_id: userId },
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Convert snake_case to camelCase for frontend
    const formattedUser = {
      id: user.id,
      auth0Id: user.auth0_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.is_email_verified === 1,
      isPhoneVerified: user.is_phone_verified === 1,
      hasPaid: user.has_paid === 1,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }

    res.status(200).json(formattedUser)
  } catch (error) {
    console.error("Error verifying payment:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export { checkJwt, logToken, getUserProfile, createUser, verifyPayment }
