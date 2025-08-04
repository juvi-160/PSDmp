import User from "../model/userModel.js";
import Order from "../model/orderModel.js";
import dotenv from "dotenv";
dotenv.config();
import { auth } from "express-oauth2-jwt-bearer";
import crypto from "crypto";
import { Op } from "sequelize";
import { authAdmin } from "../utils/firebase.js"; 

// Middleware
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: "RS256",
});

const checkAdmin = (req, res, next) => {
  if (req.auth?.payload?.roles?.includes("admin")) return next();
  res.status(403).json({ message: "Admin access required" });
};

const logToken = (req, res, next) => {
  console.log("Auth headers:", req.headers.authorization);
  console.log("Auth object:", req.auth);
  next();
};

// Format user response
const formatUserResponse = (user) => ({
  id: user.id,
  auth0Id: user.auth0_id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isEmailVerified: !!user.is_email_verified,
  isPhoneVerified: !!user.is_phone_verified,
  hasPaid: !!user.has_paid,
  isAutopayEnabled: !!user.is_autopay_enabled,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
  paymentRequired: user.role === "individual member" && !user.has_paid,
  isAssociateMember: user.role === "associate member",
});

// Generate custom ID: PSF_00001
const generateCustomUserId = async () => {
  const lastUser = await User.findOne({
    order: [["created_at", "DESC"]],
  });

  let nextId = 1;
  if (lastUser?.id?.startsWith("PSF_")) {
    const lastNumber = parseInt(lastUser.id.replace("PSF_", ""), 10);
    if (!isNaN(lastNumber)) {
      nextId = lastNumber + 1;
    }
  }

  return `PSF_${String(nextId).padStart(5, "0")}`;
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) return res.status(401).json({ message: "Invalid authentication token" });

    const user = await User.findOne({ where: { auth0_id: sub } });
    if (!user) return res.status(404).json({ message: "User not found" });

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
    if (!sub) return res.status(401).json({ message: "Invalid authentication token" });

    const { name, email } = req.body;

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ auth0_id: sub }, { email }] },
    });
    if (existingUser) return res.status(200).json(formatUserResponse(existingUser));

    const newId = await generateCustomUserId();

    const newUser = await User.create({
      id: newId,
      auth0_id: sub,
      name,
      email,
      role: "associate member",
      has_paid: false,
      is_autopay_enabled: false,
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
    if (!sub) return res.status(401).json({ message: "Invalid authentication token" });

    const user = await User.findOne({ where: { auth0_id: sub } });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "associate member") {
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

export const verifyPhoneToken = async (req, res) => {
  const { idToken } = req.body;
  const { userId } = req.params;
  try {
    const decodedToken = await authAdmin.auth().verifyIdToken(idToken);

    const phoneNumber = decodedToken.phone_number;
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number not found in token." });
    }

    // ✅ Optional: Update your database here
    await User.update({ phone: phoneNumber, phone_verified: true }, { where: { id: userId  } })

    return res.json({ message: "Phone verified successfully", phoneNumber });
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Change user role (admin-only)
const changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newRole } = req.body;

    if (!["associate member", "individual member"].includes(newRole)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "associate member" && newRole === "individual member") {
      await user.update({ role: newRole, has_paid: false });
    } else if (user.role === "individual member" && newRole === "associate member") {
      await user.update({ role: newRole, has_paid: true });
    } else {
      return res.status(400).json({ message: "Role change not allowed" });
    }

    return res.status(200).json(formatUserResponse(user));
  } catch (error) {
    console.error("Error changing user role:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyPhone = async (req, res) => {
  const { firebaseToken, userId, phone } = req.body;

  try {
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const phoneNumber = decoded.phone_number;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Token does not contain a valid phone number' });
    }

    if (phone && phone !== phoneNumber) {
      return res.status(400).json({ message: 'Phone number mismatch between token and body' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.update({
      phone: phoneNumber,
      is_phone_verified: true
    });

    return res.status(200).json({
      message: 'Phone number verified and updated',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        is_phone_verified: user.is_phone_verified
      }
    });
  } catch (err) {
    console.error('Phone verification error:', err);
    return res.status(401).json({ message: 'Invalid token', error: err.message });
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
