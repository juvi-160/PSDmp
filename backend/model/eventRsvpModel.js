// models/eventRsvpModel.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const EventRSVP = sequelize.define(
  "EventRSVP",
  {
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING, // ✅ Changed from INTEGER to STRING to match Auth0 ID
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("confirmed", "cancelled", "attended"),
      defaultValue: "confirmed",
    },
    feedback_provided: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["event_id", "user_id"],
      },
    ],
  }
);

// Associations
EventRSVP.associate = (models) => {
  EventRSVP.belongsTo(models.User, {
    foreignKey: "user_id",
    targetKey: "auth0_id", // ✅ Specify we’re linking to auth0_id, not id
    as: "user",
  });
  EventRSVP.belongsTo(models.Event, { foreignKey: "event_id", as: "event" });
};

export default EventRSVP;
