import User from "../model/userModel.js";
import Order from "../model/orderModel.js";
import dotenv from 'dotenv';
dotenv.config();
import { auth } from "express-oauth2-jwt-bearer";
import crypto from "crypto";
import { Op } from "sequelize";

// Auth0 middleware
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: "RS256",
});

// Admin check middleware
const checkAdmin = (req, res, next) => {
  if (req.auth?.payload?.roles?.includes('admin')) {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
};

// Debug middleware
const logToken = (req, res, next) => {
  console.log("Auth headers:", req.headers.authorization);
  console.log("Auth object:", req.auth);
  next();
};

// Format user response helper
const formatUserResponse = (user) => {
  return {
    id: user.id,
    auth0Id: user.auth0_id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isEmailVerified: !!user.is_email_verified,
    isPhoneVerified: !!user.is_phone_verified,
    hasPaid: !!user.has_paid,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    paymentRequired: user.role === 'individual member' && !user.has_paid,
    isAssociateMember: user.role === 'associate member'
  };
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const user = await User.findOne({
      where: { auth0_id: sub },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(formatUserResponse(user));
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const { name, email } = req.body;

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ auth0_id: sub }, { email }] },
    });

    if (existingUser) {
      return res.status(200).json(formatUserResponse(existingUser));
    }

    const newUser = await User.create({
      auth0_id: sub,
      name,
      email,
      role: 'associate member',
      has_paid: true // Associate members don't need payment
    });

    res.status(201).json(formatUserResponse(newUser));
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify payment
const verifyPayment = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const user = await User.findOne({ where: { auth0_id: sub } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Skip payment verification for associate members
    if (user.role === 'associate member') {
      return res.status(200).json(formatUserResponse(user));
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    await Order.update(
      { status: "paid", payment_id: razorpay_payment_id },
      { where: { order_id: razorpay_order_id } }
    );

    await user.update({ has_paid: true });

    res.status(200).json(formatUserResponse(user));
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin-only role change
const changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newRole } = req.body;

    if (!['associate member', 'individual member'].includes(newRole)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === 'associate member' && newRole === 'individual member') {
      await user.update({
        role: 'individual member',
        has_paid: false // requires payment
      });

      return res.status(200).json(formatUserResponse(user));
    }

    if (user.role === 'individual member' && newRole === 'associate member') {
      await user.update({
        role: 'associate member',
        has_paid: true // no payment needed
      });

      return res.status(200).json(formatUserResponse(user));
    }

    return res.status(400).json({ message: "Role change not allowed" });
  } catch (error) {
    console.error("Error changing user role:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export {
  checkJwt,
  checkAdmin,
  logToken,
  getUserProfile,
  createUser,
  verifyPayment,
  changeUserRole,
};