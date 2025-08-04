// routes/profile.js
import express from "express";
import { checkJwt } from "../controllers/authController.js";
import {
  getUserProfile,
  updateUserProfile,
  verifyPhone,
  markPhoneVerified
} from "../controllers/profileController.js";

const router = express.Router();

// router.use(checkJwt); // ✅ Only verifies the token

router.get("/", checkJwt, getUserProfile);
router.put("/", checkJwt, updateUserProfile);
router.post("/verify-phone",checkJwt, verifyPhone);
// This protects the route
router.post('/mark-phone-verified', checkJwt, markPhoneVerified);

export default router;
