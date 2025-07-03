import express from "express"
import { checkJwt } from "../controllers/authController.js"
import {
  createDynamicPlan,
  createSubscription,
  createSubscriptionWithImmediatePayment,
  createOneTimeOrder,
  getPresetPlans,
  verifyOneTimePayment,
  verifySubscriptionFirstPayment,
  handleSubscriptionWebhook,
  enableAutoPay,
  disableAutoPay,
  getSubscription,
  getSubscriptionInvoices
} from "../controllers/subscriptionController.js"

const router = express.Router()

// Get preset plans/amounts
router.get("/preset-plans", getPresetPlans)

// Create dynamic plan for custom amount
router.post("/create-dynamic-plan", checkJwt, createDynamicPlan)

// Create subscription from plan (immediate start)
router.post("/create-subscription", checkJwt, createSubscription)

// Create subscription with immediate first payment
router.post("/create-subscription-immediate", checkJwt, createSubscriptionWithImmediatePayment)

// Create one-time order
router.post("/create-one-time-order", checkJwt, createOneTimeOrder)

// Verify one-time payment
router.post("/verify-payment", checkJwt, verifyOneTimePayment)

// Verify subscription first payment
router.post("/verify-subscription-payment", checkJwt, verifySubscriptionFirstPayment)

// Webhook for subscription events
router.post("/webhook", handleSubscriptionWebhook)

// Enable/disable auto-pay routes
router.post("/enable-auto-pay",  enableAutoPay);
router.post("/disable-auto-pay", disableAutoPay);

//subscriptions finder through razorpay
router.get("/razorpay/subscriptions/:subscriptionId", getSubscription);
router.get("/razorpay/subscriptions/:subscriptionId/invoices", getSubscriptionInvoices);

export default router
