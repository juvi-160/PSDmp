import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const EventFeedback = sequelize.define(
  "EventFeedback",
  {
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ["event_id", "user_id"],
      },
    ],
  }
);

// Associations
EventFeedback.associate = (models) => {
  // Association with User model
  EventFeedback.belongsTo(models.User, {
    foreignKey: "user_id",
    as: "user",  // Alias for the User model
  });

  // Association with Event model
  EventFeedback.belongsTo(models.Event, {
    foreignKey: "event_id",
    as: "event",  // Alias for the Event model
  });
};

export default EventFeedback;
