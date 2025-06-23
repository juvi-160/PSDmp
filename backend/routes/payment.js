import express from "express"
import { checkJwt } from "../controllers/authController.js"
import { createOrder, getPaymentStatus, handleWebhook } from "../controllers/paymentController.js"

const router = express.Router()

// Protected routes
router.post("/create-order", checkJwt, createOrder)
router.get("/status/:orderId", checkJwt, getPaymentStatus)

// Public webhook route (no auth needed)
router.post("/webhook", handleWebhook)

export default router
