import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

// Helper function to generate prefixed member ID
function generateMemberId(role) {
  const prefixMap = {
    'admin': 'AD',
    'associate member': 'AM',
    'individual member': 'IM'
  };
  const prefix = prefixMap[role] || 'XX';
  const uniquePart = Math.random().toString(36).substr(2, 6).toUpperCase(); // e.g. A1B2C3
  return `${prefix}-${uniquePart}`;
}

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
    type: DataTypes.ENUM('admin', 'individual member', 'associate member', 'pending'),
    defaultValue: 'associate member'
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
  },
  member_ids: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Automatically add member ID on creation
User.beforeCreate((user) => {
  if (['admin', 'associate member', 'individual member'].includes(user.role)) {
    const newId = generateMemberId(user.role);
    user.member_ids = [newId];
  }
});

// Update the beforeCreate hook
User.beforeCreate((user) => {
  // Default to associate member if not specified
  if (!user.role) {
    user.role = 'associate member';
  }
  
  // Generate appropriate member ID
  const newId = generateMemberId(user.role);
  user.member_ids = [newId];
  
  // Individual members must have paid
  if (user.role === 'individual member') {
    user.has_paid = true;
  }
});
// Associations
User.associate = (models) => {
  User.hasMany(models.Order, { foreignKey: 'user_id', as: 'orders' });
  User.hasMany(models.EventRSVP, { foreignKey: 'user_id', as: 'rsvps' });
  User.hasMany(models.EventFeedback, { foreignKey: 'user_id', as: 'feedbacks' });
  User.hasMany(models.Ticket, { foreignKey: 'user_id', as: 'tickets' });
  User.hasMany(models.TicketResponse, { foreignKey: 'user_id', as: 'responses' });
};

export default User;
