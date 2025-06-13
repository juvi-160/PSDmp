// models/index.js
import { sequelize } from "../config/db.js";

import Event from "./eventsModel.js";
import EventRSVP from "./eventRsvpModel.js";
import Order from "./orderModel.js";
import User from "./userModel.js";
import EventFeedback from "./eventFeedbackModel.js";
import TicketResponse from "./ticketResponseModel.js";
import Ticket from "./ticketsModel.js";
import Subscription from "./subscriptionModel.js";
import SubscriptionPlan from "./subscriptionPlanModel.js";

const models = {
  Event,
  EventRSVP,
  Order,
  User,
  EventFeedback,
  TicketResponse,
  Ticket,
  Subscription,
  SubscriptionPlan,
};

// ✅ Update foreign key usage to point to auth0_id
User.hasMany(EventRSVP, { foreignKey: "user_id", sourceKey: "auth0_id", as: "rsvps" });
User.hasMany(EventFeedback, { foreignKey: "user_id", sourceKey: "auth0_id", as: "feedbacks" });
User.hasMany(Order, { foreignKey: "user_id", sourceKey: "auth0_id", as: "orders" });
User.hasMany(Ticket, { foreignKey: "user_id", sourceKey: "auth0_id", as: "tickets" });
User.hasMany(TicketResponse, { foreignKey: "user_id", sourceKey: "auth0_id", as: "responses" });
User.hasMany(Ticket, { foreignKey: "admin_id", sourceKey: "auth0_id", as: "managedTickets" });
User.hasMany(Subscription, { foreignKey: "user_id", sourceKey: "auth0_id", as: "subscriptions" });

// Event associations
Event.hasMany(EventRSVP, { foreignKey: "event_id", as: "rsvps" });
Event.hasMany(EventFeedback, { foreignKey: "event_id", as: "feedbacks" });

// EventRSVP associations
EventRSVP.belongsTo(User, { foreignKey: "user_id", targetKey: "auth0_id", as: "user" });
EventRSVP.belongsTo(Event, { foreignKey: "event_id", as: "event" });

// EventFeedback associations
EventFeedback.belongsTo(User, { foreignKey: "user_id", targetKey: "auth0_id", as: "user" });
EventFeedback.belongsTo(Event, { foreignKey: "event_id", as: "event" });

// Ticket associations
Ticket.belongsTo(User, { foreignKey: "user_id", targetKey: "auth0_id", as: "user" });
Ticket.belongsTo(User, { foreignKey: "admin_id", targetKey: "auth0_id", as: "admin", constraints: false });
Ticket.hasMany(TicketResponse, { foreignKey: "ticket_id", as: "responses" });

// TicketResponse associations
TicketResponse.belongsTo(User, { foreignKey: "user_id", targetKey: "auth0_id", as: "user" });
TicketResponse.belongsTo(Ticket, { foreignKey: "ticket_id", as: "ticket" });

// Order associations
Order.belongsTo(User, { foreignKey: "user_id", targetKey: "auth0_id", as: "user" });

// Subscription associations
Subscription.belongsTo(User, { foreignKey: "user_id", targetKey: "auth0_id", as: "user" });
Subscription.belongsTo(SubscriptionPlan, { foreignKey: "plan_id", sourceKey: "plan_id", as: "plan" });

// SubscriptionPlan associations
SubscriptionPlan.hasMany(Subscription, { foreignKey: "plan_id", sourceKey: "plan_id", as: "subscriptions" });

// Export models and sequelize instance
export { sequelize };
export default models;
