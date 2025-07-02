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
  is_autopay_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Auto-generate PSF ID
User.beforeCreate(async (user) => {
  if (!user.id) { // Only generate if not provided
    const lastUser = await User.findOne({
      order: [['created_at', 'DESC']],
      attributes: ['id']
    });

    let nextIdNumber = 1;
    if (lastUser?.id?.startsWith("PSF_")) {
      const lastNumber = parseInt(lastUser.id.split("_")[1], 10);
      if (!isNaN(lastNumber)) {
        nextIdNumber = lastNumber + 1;
      }
    }

    user.id = `PSF_${String(nextIdNumber).padStart(5, '0')}`;
  }
});

// Define associations
User.associate = (models) => {
  User.hasMany(models.Order, { foreignKey: 'user_id', as: 'orders' });
  User.hasMany(models.EventRSVP, { foreignKey: 'user_id', as: 'rsvps' });
  User.hasMany(models.EventFeedback, { foreignKey: 'user_id', as: 'feedbacks' });
  User.hasMany(models.Ticket, { foreignKey: 'user_id', as: 'tickets' });
  User.hasMany(models.TicketResponse, { foreignKey: 'user_id', as: 'responses' });
};

export default User;
