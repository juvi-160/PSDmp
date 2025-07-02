import User from "../model/userModel.js";
import Order from "../model/orderModel.js";
import ExcelJS from "exceljs";
import { Op } from "sequelize";
import nodemailer from "nodemailer";

function formatPaymentAmount(amount, currency = "INR", role) {
  if (role === 'associate member') return "Not Applicable";
  if (!amount || amount === 0) return "₹0";
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

// Updated helper function to format user response
const formatUserResponse = (user) => {
  return {
    id: user.id,
    auth0Id: user.auth0_id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isEmailVerified: !!user.is_email_verified,
    isPhoneVerified: !!user.is_phone_verified,
    hasPaid: !!user.has_paid,
    autoPayEnabled: !!user.auto_pay_enabled,
    subscriptionId: user.subscription_id || null,
    subscriptionStatus: user.subscription_status || null,
    subscriptionStartDate: user.subscription_start_date || null,
    subscriptionEndDate: user.subscription_end_date || null,
    lastPaymentDate: user.last_payment_date || null,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    paymentRequired: user.role === 'individual member' && !user.has_paid,
    isAssociateMember: user.role === 'associate member'
  };
};

export const getUsers = async (req, res) => {
  try {
    const whereClause = {};
    const { search, role, hasPaid, dateFrom, dateTo, subscriptionStatus } = req.query;

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { auth0_id: { [Op.like]: `%${search}%` } }
      ];
    }
    if (role) whereClause.role = role;
    if (hasPaid !== undefined) whereClause.has_paid = hasPaid === "true";
    if (subscriptionStatus) whereClause.subscription_status = subscriptionStatus;
    if (dateFrom) whereClause.created_at = { [Op.gte]: new Date(dateFrom) };
    if (dateTo) {
      if (whereClause.created_at) whereClause.created_at[Op.lte] = new Date(dateTo);
      else whereClause.created_at = { [Op.lte]: new Date(dateTo) };
    }

    const users = await User.findAll({
      where: whereClause,
      include: [
        {
          model: Order,
          as: "orders",
          where: { status: "paid" },
          required: false,
          order: [["created_at", "DESC"]],
          limit: 1,
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const formattedUsers = users.map(user => {
      const latestOrder = user.orders?.[0];
      const paymentAmount = user.role === 'associate member' ? 0 : (Number.parseFloat(latestOrder?.amount)) || 0;
      const paymentCurrency = latestOrder?.currency || "INR";

      const formattedUser = formatUserResponse(user);
      return {
        ...formattedUser,
        totalPaymentAmount: paymentAmount,
        formattedPaymentAmount: formatPaymentAmount(paymentAmount, paymentCurrency, user.role),
        paymentDetails: user.role === 'associate member' ? null : (latestOrder ? {
          orderId: latestOrder.order_id,
          amount: paymentAmount,
          currency: paymentCurrency,
          status: latestOrder.status,
          paymentId: latestOrder.payment_id,
          paymentDate: latestOrder.created_at,
          formattedAmount: formatPaymentAmount(paymentAmount, paymentCurrency),
          isSubscription: latestOrder.is_subscription || false
        } : null)
      };
    });

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Order, as: "orders", order: [["created_at", "DESC"]] }],
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const totalPaid = user.role === 'associate member' ? 0 : 
      user.orders
        .filter(order => order.status === "paid")
        .reduce((sum, order) => sum + (Number.parseFloat(order.amount) || 0), 0);

    const latestPaidOrder = user.orders.find(order => order.status === "paid");

    const formattedUser = formatUserResponse(user);
    res.status(200).json({
      ...formattedUser,
      totalPaymentAmount: totalPaid,
      formattedPaymentAmount: formatPaymentAmount(totalPaid, "INR", user.role),
      paymentDetails: user.role === 'associate member' ? null : (latestPaidOrder ? {
        orderId: latestPaidOrder.order_id,
        amount: Number.parseFloat(latestPaidOrder.amount) || 0,
        currency: latestPaidOrder.currency,
        status: latestPaidOrder.status,
        paymentId: latestPaidOrder.payment_id,
        paymentDate: latestPaidOrder.created_at,
        formattedAmount: formatPaymentAmount(latestPaidOrder.amount, latestPaidOrder.currency),
        isSubscription: latestPaidOrder.is_subscription || false
      } : null),
      paymentHistory: user.orders.map(order => ({
        id: order.id,
        orderId: order.order_id,
        amount: Number.parseFloat(order.amount) || 0,
        currency: order.currency,
        status: order.status,
        paymentId: order.payment_id,
        paymentDate: order.created_at,
        formattedAmount: formatPaymentAmount(order.amount, order.currency),
        isSubscription: order.is_subscription || false,
        notes: order.notes ? JSON.parse(order.notes) : null,
      }))
    });
  } catch (error) {
    console.error("Error getting user by ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserPaymentHistory = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId, {
      attributes: ["id", "role", "subscription_id", "subscription_status"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === 'associate member') {
      return res.status(200).json([]);
    }

    const paymentHistory = await Order.findAll({
      where: { user_id: user.id },
      order: [["created_at", "DESC"]],
    });

    const formattedHistory = paymentHistory.map((payment) => ({
      id: payment.id,
      orderId: payment.order_id,
      amount: Number.parseFloat(payment.amount) || 0,
      currency: payment.currency,
      status: payment.status,
      paymentId: payment.payment_id,
      paymentDate: payment.created_at,
      formattedAmount: formatPaymentAmount(payment.amount, payment.currency),
      isSubscription: payment.is_subscription || false,
      subscriptionId: payment.is_subscription ? user.subscription_id : null,
      notes: payment.notes ? JSON.parse(payment.notes) : null,
    }));

    res.status(200).json(formattedHistory);
  } catch (error) {
    console.error("Error getting payment history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { 
      role, 
      isEmailVerified, 
      isPhoneVerified, 
      hasPaid, 
      autoPayEnabled,
      subscriptionStatus,
      subscriptionId
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Automatically set has_paid to true for associate members
    const updatedHasPaid = role === 'associate member' ? true : 
                         (hasPaid !== undefined ? hasPaid : user.has_paid);

    await user.update({
      role: role || user.role,
      is_email_verified: isEmailVerified !== undefined ? isEmailVerified : user.is_email_verified,
      is_phone_verified: isPhoneVerified !== undefined ? isPhoneVerified : user.is_phone_verified,
      has_paid: updatedHasPaid,
      auto_pay_enabled: autoPayEnabled !== undefined ? autoPayEnabled : user.auto_pay_enabled,
      subscription_status: subscriptionStatus || user.subscription_status,
      subscription_id: subscriptionId || user.subscription_id
    });

    res.status(200).json(formatUserResponse(await user.reload()));
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  }
});

export const updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    const validRoles = ["admin", "individual member", "associate member", "pending"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const previousRole = user.role;
    const updateData = { role };
    
    // Automatically set payment status based on role
    if (role === 'associate member') {
      updateData.has_paid = true;
      updateData.auto_pay_enabled = false;
      updateData.subscription_status = null;
    } else if (role === 'individual member') {
      updateData.has_paid = false;
    }

    await user.update(updateData);
    await user.reload();

    let emailSent = false;

    if (previousRole === "associate member" && role === "individual member") {
      const mailOptions = {
        from: process.env.SMTP_EMAIL,
        to: user.email,
        subject: "Membership Role Updated",
        html: `
          <p>Dear ${user.name},</p>
          <p>Your membership has been updated to <strong>Individual Member</strong>.</p>
          <p>Please <a href="https://join.psfhyd.org/login">log in</a> to your dashboard.</p>
          <br>
          <p>Best regards,<br>PSF Hyderabad Team</p>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        emailSent = true;
      } catch (emailError) {
        console.error("Error sending email:", emailError.message);
      }
    }

    return res.status(200).json({ 
      user: formatUserResponse(user), 
      emailSent 
    });

  } catch (error) {
    console.error("Error updating user role:", error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Server error" });
    }
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot delete admin users" });
    }

    await user.destroy();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const exportUsersToExcel = async (req, res) => {
  try {
    const whereClause = {};
    const { search, role, hasPaid, dateFrom, dateTo, subscriptionStatus } = req.query;

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { auth0_id: { [Op.like]: `%${search}%` } },
      ];
    }

    if (role) whereClause.role = role;
    if (hasPaid !== undefined) whereClause.has_paid = hasPaid === "true";
    if (subscriptionStatus) whereClause.subscription_status = subscriptionStatus;
    if (dateFrom) whereClause.created_at = { [Op.gte]: new Date(dateFrom) };
    if (dateTo) {
      if (whereClause.created_at) {
        whereClause.created_at[Op.lte] = new Date(dateTo);
      } else {
        whereClause.created_at = { [Op.lte]: new Date(dateTo) };
      }
    }

    const users = await User.findAll({
      where: whereClause,
      include: [
        {
          model: Order,
          as: "orders",
          where: { status: "paid" },
          required: false,
          order: [["created_at", "DESC"]],
          limit: 1,
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Auth0 ID", key: "auth0_id", width: 40 },
      { header: "Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "Role", key: "role", width: 20 },
      { header: "Email Verified", key: "is_email_verified", width: 15 },
      { header: "Phone Verified", key: "is_phone_verified", width: 15 },
      { header: "Payment Status", key: "has_paid", width: 15 },
      { header: "Payment Amount", key: "payment_amount", width: 20 },
      { header: "Auto Pay Enabled", key: "auto_pay_enabled", width: 15 },
      { header: "Subscription ID", key: "subscription_id", width: 30 },
      { header: "Subscription Status", key: "subscription_status", width: 20 },
      { header: "Registered On", key: "created_at", width: 20 },
      { header: "Last Updated", key: "updated_at", width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    users.forEach((user) => {
      let paymentAmount = user.role === 'associate member' ? 0 : 
                        (Number.parseFloat(user.orders[0]?.amount) || 0);
      let paymentCurrency = user.role === 'associate member' ? "N/A" : 
                          (user.orders[0]?.currency || "INR");

      worksheet.addRow({
        id: user.id,
        auth0_id: user.auth0_id,
        name: user.name,
        email: user.email,
        phone: user.phone || "N/A",
        role: user.role,
        is_email_verified: user.is_email_verified ? "Yes" : "No",
        is_phone_verified: user.is_phone_verified ? "Yes" : "No",
        has_paid: user.role === 'associate member' ? "Not Required" : 
                 (user.has_paid ? "Paid" : "Not Paid"),
        payment_amount: formatPaymentAmount(paymentAmount, paymentCurrency, user.role),
        auto_pay_enabled: user.auto_pay_enabled ? "Yes" : "No",
        subscription_id: user.subscription_id || "N/A",
        subscription_status: user.subscription_status || "N/A",
        created_at: new Date(user.created_at).toLocaleString(),
        updated_at: new Date(user.updated_at).toLocaleString(),
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=users_export_${new Date().toISOString().split("T")[0]}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting users to Excel:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const paidUsers = await User.count({ 
      where: { 
        has_paid: true,
        role: { [Op.ne]: 'associate member' }
      } 
    });
    const associateMembers = await User.count({ where: { role: "associate member" } });
    const pendingUsers = await User.count({ where: { role: "pending" } });
    const activeSubscriptions = await User.count({ 
      where: { 
        subscription_status: "active",
        auto_pay_enabled: true
      } 
    });

    const orders = await Order.findAll({
      where: { status: "paid" },
      attributes: ["amount"],
    });

    const totalRevenue = orders.reduce((sum, order) => sum + (Number.parseFloat(order.amount) || 0), 0);

    res.status(200).json({
      totalUsers,
      paidUsers,
      associateMembers,
      pendingUsers,
      activeSubscriptions,
      totalRevenue,
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};