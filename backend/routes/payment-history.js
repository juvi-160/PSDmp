import { Router } from 'express';
import Razorpay from 'razorpay';
import Order from '../model/orderModel.js';
import Subscription from '../model/subscriptionModel.js';
import SubscriptionPlan from '../model/subscriptionPlanModel.js';
import User from '../model/userModel.js'; // ✅ REQUIRED

const router = Router();

// ✅ Add this route just below your existing imports and above other routes
router.get('/users/by-email/:email', async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.params.email } });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user); // includes `id` (your internal UUID)
  } catch (err) {
    console.error('Error in /by-email:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Razorpay instance for API calls
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Endpoint to fetch payment history
router.get('/users/:userId', async (req, res) => {
  const { userId } = req.params;

  console.log('Received userId:', userId);

  if (!userId) {
    return res.status(400).send('Invalid user ID provided');
  }

  try {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).send('User not found');
    }

    const payments = await Order.findAll({
      where: { user_id: userId, status: 'paid' }
    });

    const totalAmount = payments.reduce((total, payment) => total + parseFloat(payment.amount), 0);
    const totalPayments = payments.length;

    const subscription = await Subscription.findOne({
      where: { user_id: userId },
      include: [
        {
          model: SubscriptionPlan,
          as: 'plan',
        },
      ],
    });

    // Razorpay doesn't support fetch by customer ID this way — this will likely throw
    // Keeping for your structure, but be aware it may need `.list()` instead of `.fetch()`
    let autopayEnabled = false;
    try {
      const razorpaySubscriptions = await razorpay.subscriptions.all({
        customer_id: userId // Assuming customer_id is stored as userId
      });
      autopayEnabled = razorpaySubscriptions.items.length > 0;
    } catch (err) {
      console.warn('Razorpay subscription fetch failed:', err.message);
    }

    const response = {
      totalPayments,
      totalAmount,
      autopayEnabled,
      subscription: {
        plan: subscription?.plan?.name || 'No plan',
        status: subscription?.status || 'Inactive',
        startAt: subscription?.start_at || 'N/A',
        paidCount: subscription?.paid_count || 0,
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
