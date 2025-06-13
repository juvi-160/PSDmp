import { DataTypes } from 'sequelize';
import {sequelize} from '../config/db.js';

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  plan_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'INR'
  },
  period: {
    type: DataTypes.STRING,
    defaultValue: 'monthly'
  },
  interval_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'subscription_plans',
  timestamps: false,
  underscored: true
});

// Define associations
SubscriptionPlan.associate = (models) => {
  SubscriptionPlan.hasMany(models.Subscription, {
    foreignKey: 'plan_id',
    sourceKey: 'plan_id',
    as: 'subscriptions'
  });
};

export default SubscriptionPlan;