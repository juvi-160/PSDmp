// payment.js
import express from "express";
import { checkJwt } from "../controllers/authController.js";
import { createOrder, getPaymentStatus, handleWebhook } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order", checkJwt, createOrder);
router.get("/status/:orderId", checkJwt, getPaymentStatus);
router.post("/webhook", handleWebhook);

export default router;