import Razorpay from "razorpay"
import Order from "../model/orderModel.js"
import User from "../model/userModel.js"
import crypto from "crypto"
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file


// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// Create a new payment order
const createOrder = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" })
    }

    const user = await User.findOne({ where: { auth0_id: sub } })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const { amount, currency, receipt, notes } = req.body

    // Create order in Razorpay
    const options = {
      amount,
      currency,
      receipt,
      notes: {
        ...notes,
        userId: user.id, // Store internal user ID in notes
      },
    }

    const order = await razorpay.orders.create(options)

    // Save order in your DB using internal numeric user_id
    await Order.create({
      order_id: order.id,
      user_id: user.id,
      amount: order.amount / 100,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      notes: JSON.stringify(order.notes),
    })

    res.status(200).json(order)
  } catch (error) {
    console.error("Error creating order:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get payment status
const getPaymentStatus = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" })
    }

    const user = await User.findOne({ where: { auth0_id: sub } })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const { orderId } = req.params

    const order = await Order.findOne({
      where: {
        order_id: orderId,
        user_id: user.id,
      },
    })

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    res.status(200).json(order)
  } catch (error) {
    console.error("Error getting payment status:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Webhook handler for Razorpay events
const handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    const signature = req.headers["x-razorpay-signature"]

    const shasum = crypto.createHmac("sha256", webhookSecret)
    shasum.update(JSON.stringify(req.body))
    const digest = shasum.digest("hex")

    if (digest !== signature) {
      return res.status(400).json({ message: "Invalid webhook signature" })
    }

    const event = req.body

    if (event.event === "payment.authorized") {
      const paymentId = event.payload.payment.entity.id
      const orderId = event.payload.payment.entity.order_id

      // Update order status
      await Order.update(
        {
          status: "paid",
          payment_id: paymentId,
        },
        {
          where: { order_id: orderId },
        },
      )

      // Find order to get internal user_id
      const order = await Order.findOne({
        where: { order_id: orderId },
        attributes: ["user_id"],
      })

      if (order) {
        // Update user's role and payment status using internal ID
        await User.update(
          {
            role: "individual member",
            has_paid: true,
          },
          {
            where: { id: order.user_id },
          },
        )
      }
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error("Error handling webhook:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export { createOrder, getPaymentStatus, handleWebhook }
