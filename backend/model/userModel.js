import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

// Helper function to generate member IDs
const generateMemberId = async (role) => {
  const prefixMap = {
    'admin': 'AD',
    'associate member': 'AM',
    'individual member': 'IM'
  };

  const prefix = prefixMap[role] || 'XX';

  // Get count of users with this role
  const count = await User.count({ where: { role } });

  // Generate ID like AM_PSF_0001
  const number = (count + 1).toString().padStart(4, '0');
  return `${prefix}_PSF_${number}`;
};

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
User.beforeCreate(async (user) => {
  // Default to associate member if not specified
  if (!user.role) {
    user.role = 'associate member';
  }
  
  // Generate appropriate member ID
  if (['admin', 'associate member', 'individual member'].includes(user.role)) {
    const newId = await generateMemberId(user.role);
    user.member_ids = [newId];
  }
  
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