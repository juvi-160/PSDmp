// models/event.js
import { DataTypes } from 'sequelize';
import {sequelize} from '../config/db.js';

const Event = sequelize.define('Event', {
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Event.associate = (models) => {
  Event.hasMany(models.EventRSVP, { foreignKey: 'event_id', as: 'rsvps' });
  Event.hasMany(models.EventFeedback, { foreignKey: 'event_id', as: 'feedbacks' });
};

export default Event;