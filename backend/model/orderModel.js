import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Order = sequelize.define(
  "Order",
  {
    order_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    user_id: {
      type: DataTypes.UUID,  // ✅ fixed from INTEGER to STRING
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    receipt: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("created", "paid", "failed"),
      defaultValue: "created",
    },
    payment_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    notes: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    is_subscription: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    subscription_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// ✅ Association
Order.associate = (models) => {
  Order.belongsTo(models.User, {
    foreignKey: "user_id",
    as: "user",
  });
};

export default Order;
