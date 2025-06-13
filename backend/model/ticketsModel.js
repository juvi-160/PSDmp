// models/ticket.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Ticket = sequelize.define('Ticket', {
  subject: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
    defaultValue: 'open'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  category: {
    type: DataTypes.ENUM('general', 'payment', 'technical', 'membership', 'events', 'other'),
    defaultValue: 'general'
  },
  admin_response: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  user_id: {
    type: DataTypes.STRING(255), // ✅ changed from INTEGER to STRING
    allowNull: false
  },
  admin_id: {
    type: DataTypes.STRING(255), // ✅ added for association with admin (optional)
    allowNull: true
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    }
  ]
});

// ✅ Associations
Ticket.associate = (models) => {
  Ticket.belongsTo(models.User, {
    foreignKey: 'user_id',
    targetKey: 'auth0_id',
    as: 'user'
  });

  Ticket.belongsTo(models.User, {
    foreignKey: 'admin_id',
    targetKey: 'auth0_id',
    as: 'admin',
    constraints: false // Optional if admin is not always present
  });

  Ticket.hasMany(models.TicketResponse, {
    foreignKey: 'ticket_id',
    as: 'responses'
  });
};

export default Ticket;
