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

// Endpoint to fetch payment history by email
router.get('/by-email/:email', async (req, res) => {
  const { email } = req.params;

  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch payments for the user
    const payments = await Order.findAll({
      where: { user_id: user.id, status: 'paid' },
    });

    const totalAmount = payments.reduce((total, payment) => total + parseFloat(payment.amount), 0);
    const totalPayments = payments.length;

    // Assuming you also want to send details like transaction IDs, dates, etc.
    const paymentDetails = payments.map(payment => ({
      amount: payment.amount,
      transactionId: payment.transactionId,
      paymentDate: payment.createdAt,  // Assuming createdAt holds the payment date
      paymentMethod: payment.method,  // Assuming method is stored in the payment model
    }));

    // Assuming you have a subscription model linked to the user
    const subscription = await Subscription.findOne({
      where: { user_id: user.id },
      include: [
        {
          model: SubscriptionPlan,
          as: 'plan',
        },
      ],
    });

    const response = {
      totalPayments,
      totalAmount,
      payments: paymentDetails, // Additional payment details
      autopayEnabled: false,    // You can change this to fetch from Razorpay if needed
      subscription: {
        plan: subscription?.plan?.name || 'No plan',
        status: subscription?.status || 'Inactive',
        startAt: subscription?.start_at || 'N/A',
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).send('Internal Server Error');
  }
});


export default router;
