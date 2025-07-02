import Razorpay from "razorpay";
import Order from "../model/orderModel.js";
import User from "../model/userModel.js";
import Subscription from "../model/subscriptionModel.js";
import SubscriptionPlan from "../model/subscriptionPlanModel.js";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create dynamic subscription plan for custom amount
export const createDynamicPlan = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const { amount, currency = "INR" } = req.body;

    // Validate minimum amount (₹300)
    if (amount < 300) {
      return res.status(400).json({ message: "Minimum amount is ₹300" });
    }

    const amountInPaise = amount * 100;

    // Create plan in Razorpay
    const planData = {
      item: {
        name: `PSF Custom Membership - ₹${amount}`,
        amount: amountInPaise,
        currency: currency,
        description: `Custom monthly membership plan for ₹${amount}`,
      },
      period: "monthly",
      interval: 1,
      notes: {
        customAmount: amount,
        createdFor: sub,
      },
    };

    const razorpayPlan = await razorpay.plans.create(planData);

    // Save plan in our database using Sequelize
    await SubscriptionPlan.create({
      plan_id: razorpayPlan.id, // This must match what you'll use in subscriptions
      name: `PSF Custom Membership - ₹${amount}`,
      amount: amount,
      currency: currency,
      period: "monthly",
      interval_count: 1,
      description: `Custom monthly membership plan for ₹${amount}`,
      is_active: true,
    });

    res.status(200).json({
      plan: razorpayPlan,
      planId: razorpayPlan.id,
      amount: amount,
      amountInPaise: amountInPaise,
    });
  } catch (error) {
    console.error("Error creating dynamic plan:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create subscription with immediate first payment
export const createSubscriptionWithImmediatePayment = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }
    

    // Get user with database ID
    const user = await User.findOne({
      where: { auth0_id: sub },
      attributes: ["id", "auth0_id"], // Get both IDs
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { planId, amount, customerNotify = true, notes = {} } = req.body;

    // Step 1: Create immediate payment order for first month
    const firstPaymentOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `first_payment_${new Date().getTime()}`,
      notes: {
        ...notes,
        userId: user.id.toString(), // Use database ID
        auth0Id: user.auth0_id, // Store auth0_id in notes for reference
        paymentType: "subscription-first-payment",
        planId: planId,
      },
    });

    // Step 2: Create subscription starting from next month
    const nextMonthStart = new Date();
    nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
    nextMonthStart.setDate(1);
    nextMonthStart.setHours(0, 0, 0, 0);

    const subscriptionData = {
      plan_id: planId,
      customer_notify: customerNotify,
      quantity: 1,
      total_count: 11,
      start_at: Math.floor(nextMonthStart.getTime() / 1000),
      notes: {
        ...notes,
        userId: user.id.toString(), // Use database ID
        auth0Id: user.auth0_id,
        paymentType: "monthly-subscription",
        firstPaymentOrderId: firstPaymentOrder.id,
      },
    };

    const subscription = await razorpay.subscriptions.create(subscriptionData);
    

    // Save records with database user_id
    await Order.create({
      order_id: firstPaymentOrder.id,
      user_id: user.id, // Database ID
      amount: amount,
      currency: firstPaymentOrder.currency,
      receipt: firstPaymentOrder.receipt,
      status: firstPaymentOrder.status,
      notes: JSON.stringify(firstPaymentOrder.notes),
      is_subscription: true,
    });

   const PID= await SubscriptionPlan.findOne({where:{'plan_id':planId}})
console.log({
      subscription_id: subscription.id,
      user_id: user.id, // Database ID
      plan_id: PID.id,
      status: subscription.status,
      start_at: new Date(subscription.start_at * 1000),
      notes: JSON.stringify(subscription.notes),
    })

    await Subscription.create({
      subscription_id: subscription.id,
      user_id: user.id, // Database ID
      plan_id: PID.plan_id,
      status: subscription.status,
      start_at: new Date(subscription.start_at * 1000),
      notes: JSON.stringify(subscription.notes),
    });
    

    res.status(200).json({
      firstPaymentOrder,
      subscription,
      message: "Subscription created with immediate first payment",
    });
  } catch (error) {
    console.error("Error creating subscription with immediate payment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create subscription from plan (original method - kept for compatibility)
export const createSubscription = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    // Get user with database ID
    const user = await User.findOne({
      where: { auth0_id: sub },
      attributes: ["id", "auth0_id"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { planId, customerNotify = true, notes = {} } = req.body;

    const subscriptionData = {
      plan_id: planId,
      customer_notify: customerNotify,
      quantity: 1,
      total_count: 12,
      start_at: Math.floor(Date.now() / 1000),
      notes: {
        ...notes,
        userId: user.id.toString(), // Database ID
        auth0Id: user.auth0_id,
        paymentType: "monthly-subscription",
      },
    };

    const subscription = await razorpay.subscriptions.create(subscriptionData);

    await Subscription.create({
      subscription_id: subscription.id,
      user_id: user.id, // Database ID
      plan_id: planId,
      status: subscription.status,
      start_at: new Date(subscription.start_at * 1000),
      notes: JSON.stringify(subscription.notes),
    });

    res.status(200).json(subscription);
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create one-time payment order (1-month membership)
export const createOneTimeOrder = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    // Get user with database ID
    const user = await User.findOne({
      where: { auth0_id: sub },
      attributes: ["id", "auth0_id"],
    });

    // console.log(user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { amount, currency = "INR", notes = {} } = req.body;

    if (amount < 300) {
      return res.status(400).json({ message: "Minimum amount is ₹300" });
    }

    const amountInPaise = amount * 100;
    const options = {
      amount: amountInPaise,
      currency,
      receipt: `onetime_${new Date().getTime()}`,
      notes: {
        ...notes,
        userId: user.id.toString(), // Database ID
        auth0Id: user.auth0_id,
        paymentType: "one-time",
        membershipDuration: "1-month",
        originalAmount: amount,
      },
    };

    console.log(options);

    const order = await razorpay.orders.create(options);
    // console.log(order)
    console.log(
      order.id,
      user.id,
      amount,
      order.currency,
      order.receipt,
      order.status,
      order.notes
    );
    await Order.create({
      order_id: order.id,
      user_id: user.id, // Database ID
      amount: amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      notes: JSON.stringify(order.notes),
      is_subscription: false,
    });

    res.status(200).json(order);
  } catch (error) {
    console.error("Error creating one-time order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Verify payment for one-time orders
export const verifyOneTimePayment = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Update order status
    await Order.update(
      {
        status: "paid",
        payment_id: razorpay_payment_id,
      },
      {
        where: { order_id: razorpay_order_id },
      }
    );

    // Get order details
    const order = await Order.findOne({
      where: { order_id: razorpay_order_id },
      attributes: ["user_id", "notes"],
    });

    if (order) {
      // Update user status using database ID
      await User.update(
        {
          role: "individual member",
          has_paid: true,
        },
        {
          where: { id: order.user_id }, // Now using database ID
        }
      );
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      membershipType: "one-time",
      duration: "1 month",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get preset subscription plans
export const getPresetPlans = async (req, res) => {
  try {
    // Return preset amounts for quick selection
    const presetPlans = [
      {
        id: 1,
        amount: 300,
        name: "Basic Membership",
        description: "Essential benefits and access to events",
        recommended: false,
      },
      {
        id: 2,
        amount: 700,
        name: "Standard Membership",
        description:
          "Additional networking opportunities and priority registration",
        recommended: true,
      },
      {
        id: 3,
        amount: 1000,
        name: "Premium Membership",
        description:
          "Full access with exclusive mentorship and premium sessions",
        recommended: false,
      },
    ];

    res.status(200).json(presetPlans);
  } catch (error) {
    console.error("Error fetching preset plans:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify payment for subscription first payment
export const verifySubscriptionFirstPayment = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Update order status
    await Order.update(
      {
        status: "paid",
        payment_id: razorpay_payment_id,
      },
      {
        where: { order_id: razorpay_order_id },
      }
    );

    // Get order details
    const order = await Order.findOne({
      where: { order_id: razorpay_order_id },
      attributes: ["user_id", "notes"],
    });

    if (order) {
      const membershipEndDate = new Date();
      membershipEndDate.setMonth(membershipEndDate.getMonth() + 1);

      // Update user status using database ID
      await User.update(
        {
          role: "individual member",
          has_paid: true,
          subscription_status: "active",
          subscription_start_date: new Date(),
          subscription_end_date: membershipEndDate,
          auto_pay_enabled: true,
        },
        {
          where: { id: order.user_id }, // Using database ID
        }
      );
    }

    res.status(200).json({
      success: true,
      message: "First payment verified successfully",
      membershipType: "subscription",
      duration: "monthly auto-renewal",
    });
  } catch (error) {
    console.error("Error verifying subscription first payment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Webhook handler for subscription events
export const handleSubscriptionWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    // Verify webhook signature
    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== signature) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const event = req.body;
    console.log("Received webhook event:", event.event);

    switch (event.event) {
      case "subscription.activated":
        await handleSubscriptionActivated(event.payload.subscription.entity);
        break;
      case "subscription.charged":
        await handleSubscriptionCharged(
          event.payload.subscription.entity,
          event.payload.payment.entity
        );
        break;
      case "subscription.cancelled":
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;
      case "subscription.completed":
        await handleSubscriptionCompleted(event.payload.subscription.entity);
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error handling subscription webhook:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper functions for webhook events
const handleSubscriptionActivated = async (subscription) => {
  try {
    // Update subscription status using Sequelize
    await Subscription.update(
      {
        status: subscription.status,
        current_start: new Date(subscription.current_start * 1000),
        current_end: new Date(subscription.current_end * 1000),
      },
      {
        where: { subscription_id: subscription.id },
      }
    );

    // Get subscription details
    const subRecord = await Subscription.findOne({
      where: { subscription_id: subscription.id },
      attributes: ["user_id"],
    });

    if (subRecord) {
      const userId = subRecord.user_id;

      // Update user status for monthly subscription using Sequelize
      await User.update(
        {
          role: "individual member",
          has_paid: true,
          subscription_id: subscription.id,
          subscription_status: subscription.status,
          subscription_start_date: new Date(subscription.current_start * 1000),
          subscription_end_date: new Date(subscription.current_end * 1000),
          auto_pay_enabled: true,
        },
        {
          where: { id: userId },
        }
      );
    }
  } catch (error) {
    console.error("Error handling subscription activated:", error);
  }
};

const handleSubscriptionCharged = async (subscription, payment) => {
  try {
    // Update subscription paid count using Sequelize
    await Subscription.update(
      {
        paid_count: subscription.paid_count,
        current_start: new Date(subscription.current_start * 1000),
        current_end: new Date(subscription.current_end * 1000),
      },
      {
        where: { subscription_id: subscription.id },
      }
    );

    // Get subscription details
    const subRecord = await Subscription.findOne({
      where: { subscription_id: subscription.id },
      attributes: ["user_id"],
    });

    if (subRecord) {
      // Create payment record using Sequelize
      await Order.create({
        order_id: payment.order_id || `sub_${subscription.id}_${Date.now()}`,
        user_id: subRecord.user_id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: "paid",
        payment_id: payment.id,
        subscription_id: subscription.id,
        is_subscription: true,
        notes: JSON.stringify({
          subscription_payment: true,
          charge_cycle: subscription.paid_count,
        }),
      });

      // Update user subscription end date (extend by 1 month)
      await User.update(
        {
          subscription_end_date: new Date(subscription.current_end * 1000),
        },
        {
          where: { id: subRecord.user_id },
        }
      );
    }
  } catch (error) {
    console.error("Error handling subscription charged:", error);
  }
};

const handleSubscriptionCancelled = async (subscription) => {
  try {
    // Update subscription status using Sequelize
    await Subscription.update(
      {
        status: subscription.status,
      },
      {
        where: { subscription_id: subscription.id },
      }
    );

    // Get subscription details
    const subRecord = await Subscription.findOne({
      where: { subscription_id: subscription.id },
      attributes: ["user_id"],
    });

    if (subRecord) {
      // Update user status using Sequelize
      await User.update(
        {
          subscription_status: subscription.status,
          auto_pay_enabled: false,
        },
        {
          where: { id: subRecord.user_id },
        }
      );
    }
  } catch (error) {
    console.error("Error handling subscription cancelled:", error);
  }
};

const handleSubscriptionCompleted = async (subscription) => {
  try {
    // Update subscription status using Sequelize
    await Subscription.update(
      {
        status: subscription.status,
      },
      {
        where: { subscription_id: subscription.id },
      }
    );

    // Get subscription details
    const subRecord = await Subscription.findOne({
      where: { subscription_id: subscription.id },
      attributes: ["user_id"],
    });

    if (subRecord) {
      // Update user status using Sequelize
      await User.update(
        {
          subscription_status: subscription.status,
          auto_pay_enabled: false,
        },
        {
          where: { id: subRecord.user_id },
        }
      );
    }
  } catch (error) {
    console.error("Error handling subscription completed:", error);
  }
};


// Enable auto-pay for a subscription
export const enableAutoPay = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const user = await User.findOne({
      where: { auth0_id: sub },
      attributes: ["id", "subscription_id"],
    });

    if (!user || !user.subscription_id) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    // Update Razorpay subscription
    await razorpay.subscriptions.resume(user.subscription_id);

    // Update our database
    await Subscription.update(
      {
        status: "active",
      },
      {
        where: { subscription_id: user.subscription_id },
      }
    );

    await User.update(
      {
        auto_pay_enabled: true,
        subscription_status: "active",
      },
      {
        where: { id: user.id },
      }
    );

    res.status(200).json({
      success: true,
      message: "Auto-pay enabled successfully",
    });
  } catch (error) {
    console.error("Error enabling auto-pay:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Disable auto-pay for a subscription
export const disableAutoPay = async (req, res) => {
  try {
    const sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const user = await User.findOne({
      where: { auth0_id: sub },
      attributes: ["id", "subscription_id"],
    });

    if (!user || !user.subscription_id) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    // Update Razorpay subscription
    await razorpay.subscriptions.cancel(user.subscription_id);

    // Update our database
    await Subscription.update(
      {
        status: "cancelled",
      },
      {
        where: { subscription_id: user.subscription_id },
      }
    );

    await User.update(
      {
        auto_pay_enabled: false,
        subscription_status: "cancelled",
      },
      {
        where: { id: user.id },
      }
    );

    res.status(200).json({
      success: true,
      message: "Auto-pay disabled successfully",
    });
  } catch (error) {
    console.error("Error disabling auto-pay:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};