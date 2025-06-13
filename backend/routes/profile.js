// File: routes/profile.js
import express from "express";
import { checkJwt } from "../controllers/authController.js"; // Corrected import
import { getUserProfile, updateUserProfile } from "../controllers/profileController.js";

const router = express.Router();
router.get("/", checkJwt, getUserProfile);
router.put("/", checkJwt, updateUserProfile);
export default router;