import User from "../model/userModel.js";
import Order from "../model/orderModel.js";
import dotenv from 'dotenv';
dotenv.config();
import { auth } from "express-oauth2-jwt-bearer";
import crypto from "crypto";
import { Op } from "sequelize";

// Helper function to generate member IDs
const generateMemberId = async (role) => {
  const prefixMap = {
    'admin': 'AD',
    'associate member': 'AM',
    'individual member': 'IM'
  };

  const prefix = prefixMap[role] || 'XX';
  // Get count of users with this role
  const count = await User.count({ where: { role } });
  // Generate ID like AM_PSF_0001
  const number = (count + 1).toString().padStart(4, '0');
  return `${prefix}_PSF_${number}`;
};


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
    memberIds: user.member_ids || [],
    currentMemberId: user.member_ids?.[user.member_ids.length - 1] || null,
    isEmailVerified: !!user.is_email_verified,
    isPhoneVerified: !!user.is_phone_verified,
    hasPaid: !!user.has_paid,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    paymentRequired: user.role === 'individual member' && !user.has_paid
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

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { [Op.or]: [{ auth0_id: sub }, { email }] }
    });

    if (existingUser) {
      return res.status(200).json(formatUserResponse(existingUser));
    }

    // Create new user as associate member by default
    const newUser = await User.create({
      auth0_id: sub,
      name,
      email,
      role: 'associate member', // Default role
      has_paid: false
    });

    res.status(201).json(formatUserResponse(newUser));
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify payment (for both associate and individual members)
const verifyPayment = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // Verify payment signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Update order status
    await Order.update(
      { status: "paid", payment_id: razorpay_payment_id },
      { where: { order_id: razorpay_order_id } }
    );

    // Get current user
    const user = await User.findOne({ where: { auth0_id: sub } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update payment status but keep the same role
    await user.update({ has_paid: true });

    res.status(200).json(formatUserResponse(user));
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin-only endpoint to change user role
const changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newRole } = req.body;

    // Validate new role
    if (!['associate member', 'individual member'].includes(newRole)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Only allow associate → individual changes
    if (user.role === 'associate member' && newRole === 'individual member') {
      const newId = generateMemberId(newRole);
      await user.update({
        role: newRole,
        member_ids: [...(user.member_ids || []), newId],
        has_paid: false // Require payment for new individual members
      });
      
      return res.status(200).json(formatUserResponse(user));
    }

    res.status(400).json({ message: "Role change not allowed" });
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
  changeUserRole 
};