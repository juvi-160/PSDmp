import express from "express";
import { checkJwt } from "../controllers/authController.js";
import {
  getUserProfile,
  updateUserProfile,
  verifyPhone,
} from "../controllers/profileController.js";

const router = express.Router();

router.use(checkJwt);  // Auth0 JWT validation for all routes
router.get("/", getUserProfile);
router.put("/", updateUserProfile);
router.post("/verify-phone", verifyPhone);

export default router;
