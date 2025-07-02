import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const TicketResponse = sequelize.define(
  "TicketResponse",
  {
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_admin_response: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    responder_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    responder_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { fields: ["ticket_id"] },
      { fields: ["created_at"] },
    ],
  }
);

// ✅ Correct associations
TicketResponse.associate = (models) => {
  TicketResponse.belongsTo(models.Ticket, {
    foreignKey: "ticket_id",
    as: "ticket",
  });

  TicketResponse.belongsTo(models.User, {
    foreignKey: "user_id",
    as: "user",
  });
};

export default TicketResponse;
