import express from "express"
import { checkJwt } from "../controllers/authController.js"
import { getUserProfile, updateUserProfile } from "../controllers/profileController.js"

const router = express.Router()

// Apply auth middleware to all profile routes
router.use(checkJwt)

router.get("/", getUserProfile)
router.put("/", updateUserProfile)

export default router
