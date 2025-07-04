import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
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
    unique: true,
    validate: { isEmail: true }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'individual member', 'associate member', 'pending'),
    defaultValue: 'associate member'
  },
  subscription_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  subscription_status: {
    type: DataTypes.ENUM('active', 'pending', 'cancelled', 'halted'),
    allowNull: true
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
  auto_pay_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  subscription_start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  subscription_end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_payment_date: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // 🆕 Additional Fields
  age_group: {
    type: DataTypes.ENUM('Under 18', '18-25', '26-35', '36-50', '51+'),
    allowNull: true
  },
  profession: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  area_of_interests: {
    type: DataTypes.TEXT, // Comma-separated list or JSON string
    allowNull: true
  },
  about_you: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['email'] },
    { unique: true, fields: ['auth0_id'] }
  ]
});


// Improved ID generation
User.beforeCreate(async (user) => {
  if (!user.id) {
    const lastUser = await User.findOne({
      order: [['created_at', 'DESC']],
      attributes: ['id']
    });

    let nextIdNumber = 1;
    if (lastUser?.id) {
      const matches = lastUser.id.match(/PSF_(\d+)/);
      if (matches && matches[1]) {
        nextIdNumber = parseInt(matches[1], 10) + 1;
      }
    }

    user.id = `PSF_${String(nextIdNumber).padStart(5, '0')}`;
  }
});

// Define associations
User.associate = (models) => {
  User.hasMany(models.Order, { 
    foreignKey: 'user_id', 
    as: 'orders' 
  });
  User.hasMany(models.EventRSVP, { 
    foreignKey: 'user_id', 
    as: 'rsvps' 
  });
  User.hasMany(models.EventFeedback, { 
    foreignKey: 'user_id', 
    as: 'feedbacks' 
  });
  User.hasMany(models.Ticket, { 
    foreignKey: 'user_id', 
    as: 'tickets' 
  });
  User.hasMany(models.TicketResponse, { 
    foreignKey: 'user_id', 
    as: 'responses' 
  });
  User.hasMany(models.Subscription, {
    foreignKey: 'user_id',
    as: 'subscriptions'
  });
};

export default User;