import User from "../model/userModel.js"
import Order from "../model/orderModel.js"
import ExcelJS from "exceljs"
import { Op } from "sequelize"

// Helper function to format payment amount
function formatPaymentAmount(amount, currency = "INR") {
  if (!amount || amount === 0) return "₹0"

  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return formatter.format(amount)
}

// Get all users with optional filtering
// export const getUsers = async (req, res) => {
//   try {
//     const whereClause = {}
//     const { search, role, hasPaid, dateFrom, dateTo } = req.query

//     if (search) {
//       whereClause[Op.or] = [
//         { name: { [Op.like]: `%${search}%` } },
//         { email: { [Op.like]: `%${search}%` } },
//         { auth0_id: { [Op.like]: `%${search}%` } },
//       ]
//     }
//     if (role) whereClause.role = role
//     if (hasPaid !== undefined) whereClause.has_paid = hasPaid === "true"
//     if (dateFrom) whereClause.created_at = { [Op.gte]: new Date(dateFrom) }
//     if (dateTo) {
//       if (whereClause.created_at) whereClause.created_at[Op.lte] = new Date(dateTo)
//       else whereClause.created_at = { [Op.lte]: new Date(dateTo) }
//     }

//     const users = await User.findAll({
//       where: whereClause,
//       include: [
//         {
//           model: Order,
//           as: "orders",
//           where: { status: "paid" },
//           required: false,
//           order: [["created_at", "DESC"]],
//           limit: 1,
//         },
//       ],
//       order: [["created_at", "DESC"]],
//     })

//     const formattedUsers = users.map(user => {
//       const latestOrder = user.orders?.[0]
//       const paymentAmount = Number.parseFloat(latestOrder?.amount) || 0
//       const paymentCurrency = latestOrder?.currency || "INR"

//       return {
//         id: user.id,
//         auth0Id: user.auth0_id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//         memberIds: user.member_ids,
//         currentMemberId: user.member_ids?.[user.member_ids.length - 1] || null,
//         isEmailVerified: !!user.is_email_verified,
//         isPhoneVerified: !!user.is_phone_verified,
//         hasPaid: !!user.has_paid,
//         createdAt: user.created_at,
//         updatedAt: user.updated_at,
//         totalPaymentAmount: paymentAmount,
//         formattedPaymentAmount: formatPaymentAmount(paymentAmount, paymentCurrency),
//         paymentDetails: latestOrder
//           ? {
//               orderId: latestOrder.order_id,
//               amount: paymentAmount,
//               currency: paymentCurrency,
//               status: latestOrder.status,
//               paymentId: latestOrder.payment_id,
//               paymentDate: latestOrder.created_at,
//               formattedAmount: formatPaymentAmount(paymentAmount, paymentCurrency),
//             }
//           : null,
//       }
//     })

//     res.status(200).json(formattedUsers)
//   } catch (error) {
//     console.error("Error getting users:", error)
//     res.status(500).json({ message: "Server error", error: error.message })
//   }
// }

export const getUsers = async (req, res) => {
  try {
    const whereClause = {}
    const { search, role, hasPaid, dateFrom, dateTo } = req.query

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { auth0_id: { [Op.like]: `%${search}%` } },
        { member_ids: { [Op.like]: `%${search}%` } } // Add search for member IDs
      ]
    }
    if (role) whereClause.role = role
    if (hasPaid !== undefined) whereClause.has_paid = hasPaid === "true"
    if (dateFrom) whereClause.created_at = { [Op.gte]: new Date(dateFrom) }
    if (dateTo) {
      if (whereClause.created_at) whereClause.created_at[Op.lte] = new Date(dateTo)
      else whereClause.created_at = { [Op.lte]: new Date(dateTo) }
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
    })

    const formattedUsers = users.map(user => {
      const latestOrder = user.orders?.[0]
      const paymentAmount = Number.parseFloat(latestOrder?.amount) || 0
      const paymentCurrency = latestOrder?.currency || "INR"

      return {
        id: user.id,
        auth0Id: user.auth0_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        memberIds: user.member_ids,
        currentMemberId: user.member_ids?.[user.member_ids.length - 1] || null,
        isEmailVerified: !!user.is_email_verified,
        isPhoneVerified: !!user.is_phone_verified,
        hasPaid: !!user.has_paid,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        totalPaymentAmount: paymentAmount,
        formattedPaymentAmount: formatPaymentAmount(paymentAmount, paymentCurrency),
        paymentDetails: latestOrder
          ? {
              orderId: latestOrder.order_id,
              amount: paymentAmount,
              currency: paymentCurrency,
              status: latestOrder.status,
              paymentId: latestOrder.payment_id,
              paymentDate: latestOrder.created_at,
              formattedAmount: formatPaymentAmount(paymentAmount, paymentCurrency),
            }
          : null,
        requiresPayment: user.role === 'individual member' && !user.has_paid // Add this field
      }
    })

    res.status(200).json(formattedUsers)
  } catch (error) {
    console.error("Error getting users:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Order, as: "orders", order: [["created_at", "DESC"]] }],
    })
    if (!user) return res.status(404).json({ message: "User not found" })

    const totalPaid = user.orders
      .filter(order => order.status === "paid")
      .reduce((sum, order) => sum + (Number.parseFloat(order.amount) || 0), 0)

    const latestPaidOrder = user.orders.find(order => order.status === "paid")

    const formattedUser = {
      id: user.id,
      auth0Id: user.auth0_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      memberIds: user.member_ids,
      currentMemberId: user.member_ids?.[user.member_ids.length - 1] || null,
      isEmailVerified: !!user.is_email_verified,
      isPhoneVerified: !!user.is_phone_verified,
      hasPaid: !!user.has_paid,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      totalPaymentAmount: totalPaid,
      formattedPaymentAmount: formatPaymentAmount(totalPaid),
      paymentDetails: latestPaidOrder
        ? {
            orderId: latestPaidOrder.order_id,
            amount: Number.parseFloat(latestPaidOrder.amount) || 0,
            currency: latestPaidOrder.currency,
            status: latestPaidOrder.status,
            paymentId: latestPaidOrder.payment_id,
            paymentDate: latestPaidOrder.created_at,
            formattedAmount: formatPaymentAmount(latestPaidOrder.amount, latestPaidOrder.currency),
          }
        : null,
      paymentHistory: user.orders.map(order => ({
        id: order.id,
        orderId: order.order_id,
        amount: Number.parseFloat(order.amount) || 0,
        currency: order.currency,
        status: order.status,
        paymentId: order.payment_id,
        paymentDate: order.created_at,
        formattedAmount: formatPaymentAmount(order.amount, order.currency),
        notes: order.notes ? JSON.parse(order.notes) : null,
      })),
    }

    res.status(200).json(formattedUser)
  } catch (error) {
    console.error("Error getting user by ID:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}


// Get user payment history
export const getUserPaymentHistory = async (req, res) => {
  try {
    const userId = req.params.id

    // Get user auth0_id
    const user = await User.findByPk(userId, {
      attributes: ["auth0_id"],
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const paymentHistory = await Order.findAll({
      where: { user_id: user.auth0_id },
      order: [["created_at", "DESC"]],
    })

    const formattedHistory = paymentHistory.map((payment) => ({
      id: payment.id,
      orderId: payment.order_id,
      amount: Number.parseFloat(payment.amount) || 0,
      currency: payment.currency,
      status: payment.status,
      paymentId: payment.payment_id,
      paymentDate: payment.created_at,
      formattedAmount: formatPaymentAmount(payment.amount, payment.currency),
      notes: payment.notes ? JSON.parse(payment.notes) : null,
    }))

    res.status(200).json(formattedHistory)
  } catch (error) {
    console.error("Error getting payment history:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update user
export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id
    const { role, isEmailVerified, isPhoneVerified, hasPaid } = req.body

    // Check if user exists
    const user = await User.findByPk(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update user
    await user.update({
      role: role || user.role,
      is_email_verified: isEmailVerified !== undefined ? isEmailVerified : user.is_email_verified,
      is_phone_verified: isPhoneVerified !== undefined ? isPhoneVerified : user.is_phone_verified,
      has_paid: hasPaid !== undefined ? hasPaid : user.has_paid,
    })

    // Return updated user
    await user.reload()
    res.status(200).json(user)
  } catch (error) {
    console.error("Error updating user:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Update user role only
export const updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id
    const { role } = req.body

    // Validate role
    const validRoles = ["admin", "individual member", "associate member", "pending"]
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" })
    }

    // Check if user exists
    const user = await User.findByPk(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update user role
    await user.update({ role })

    // Return updated user
    await user.reload()
    res.status(200).json(user)
  } catch (error) {
    console.error("Error updating user role:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id

    // Check if user exists
    const user = await User.findByPk(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Prevent deletion of admin users
    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot delete admin users" })
    }

    // Delete user (cascade will handle related records)
    await user.destroy()

    res.status(200).json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Export users to Excel
export const exportUsersToExcel = async (req, res) => {
  try {
    const whereClause = {}
    const { search, role, hasPaid, dateFrom, dateTo } = req.query

    // Apply filters (same as getUsers)
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { auth0_id: { [Op.like]: `%${search}%` } },
      ]
    }

    if (role) whereClause.role = role
    if (hasPaid !== undefined) whereClause.has_paid = hasPaid === "true"
    if (dateFrom) whereClause.created_at = { [Op.gte]: new Date(dateFrom) }
    if (dateTo) {
      if (whereClause.created_at) {
        whereClause.created_at[Op.lte] = new Date(dateTo)
      } else {
        whereClause.created_at = { [Op.lte]: new Date(dateTo) }
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
    })

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Users")

    // Add headers
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
      { header: "Registered On", key: "created_at", width: 20 },
      { header: "Last Updated", key: "updated_at", width: 20 },
    ]

    // Style the header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    }

    // Add rows
    users.forEach((user) => {
      let paymentAmount = 0
      let paymentCurrency = "INR"

      if (user.orders && user.orders.length > 0) {
        paymentAmount = Number.parseFloat(user.orders[0].amount) || 0
        paymentCurrency = user.orders[0].currency || "INR"
      }

      worksheet.addRow({
        id: user.id,
        auth0_id: user.auth0_id,
        name: user.name,
        email: user.email,
        phone: user.phone || "N/A",
        role: user.role,
        is_email_verified: user.is_email_verified ? "Yes" : "No",
        is_phone_verified: user.is_phone_verified ? "Yes" : "No",
        has_paid: user.has_paid ? "Paid" : "Not Paid",
        payment_amount: formatPaymentAmount(paymentAmount, paymentCurrency),
        created_at: new Date(user.created_at).toLocaleString(),
        updated_at: new Date(user.updated_at).toLocaleString(),
      })
    })

    // Set content type and headers for file download
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=users_export_${new Date().toISOString().split("T")[0]}.xlsx`,
    )

    // Write to response
    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error("Error exporting users to Excel:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.count()

    // Get paid users count
    const paidUsers = await User.count({ where: { has_paid: true } })

    // Get pending users count
    const pendingUsers = await User.count({ where: { role: "pending" } })

    // Get total revenue
    const orders = await Order.findAll({
      where: { status: "paid" },
      attributes: ["amount"],
    })

    const totalRevenue = orders.reduce((sum, order) => sum + (Number.parseFloat(order.amount) || 0), 0)

    res.status(200).json({
      totalUsers,
      paidUsers,
      pendingUsers,
      totalRevenue,
    })
  } catch (error) {
    console.error("Error getting user stats:", error)
    res.status(500).json({ message: "Server error" })
  }
}
