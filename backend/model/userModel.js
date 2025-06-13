// models/user.js
import { DataTypes } from 'sequelize';
import {sequelize} from '../config/db.js';

const User = sequelize.define('User', {
  auth0_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'individual member', 'pending'),
    defaultValue: 'pending'
  },
  is_email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_phone_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  has_paid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

User.associate = (models) => {
  User.hasMany(models.Order, { foreignKey: 'user_id', as: 'orders' });
  User.hasMany(models.EventRSVP, { foreignKey: 'user_id', as: 'rsvps' });
  User.hasMany(models.EventFeedback, { foreignKey: 'user_id', as: 'feedbacks' });
  User.hasMany(models.Ticket, { foreignKey: 'user_id', as: 'tickets' });
  User.hasMany(models.TicketResponse, { foreignKey: 'user_id', as: 'responses' });
};

export default User;