import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Subscription = sequelize.define(
  "Subscription",
  {
    subscription_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    customer_id: {
      type: DataTypes.STRING,
      allowNull: true, // This allows you to recover subscriptions using Razorpay's API
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    plan_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "created",
    },
    start_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    current_start: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    current_end: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paid_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    contribution_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Optional message about why the user is contributing to PSF"
    }
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);


// ✅ Associations
Subscription.associate = (models) => {
  Subscription.belongsTo(models.User, {
    foreignKey: "user_id",
    as: "user",
  });

  Subscription.belongsTo(models.SubscriptionPlan, {
    foreignKey: "plan_id",
    as: "plan",
  });
};

export default Subscription;
