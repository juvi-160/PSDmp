import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sequelize } from "./config/db.js";
const PORT = process.env.PORT;

//models
import User from "./model/userModel.js";
import Event from "./model/eventsModel.js";
import EventRSVP from "./model/eventRsvpModel.js";
import EventFeedback from "./model/eventFeedbackModel.js";
import Order from "./model/orderModel.js";
import TicketResponse from "./model/ticketResponseModel.js";
import Ticket from "./model/ticketsModel.js";
import Subscription from "./model/subscriptionModel.js";
import SubscriptionPlan from './model/subscriptionPlanModel.js';



//routes
import eventRoutes from './routes/events.js';
import rsvpRoutes from './routes/rsvps.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payment.js';
import profileRoutes from './routes/profile.js';
import ticketRoutes from './routes/tickets.js';
import subscriptionRoutes from "./routes/subscription.js"

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/.env') });


const app = express();


async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully!");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

testConnection();

async function syncDb(){
  await sequelize.sync({ force: true });
  console.log('All models were synchronized successfully.');
}
syncDb()


/// Middleware
app.use(cors({
  origin: ['http://localhost:4200', ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for testing
  crossOriginResourcePolicy: false // Disable CORP for testing
}));

app.use(express.json());
app.use(morgan('dev'));

// Serve static files from uploads directory
// Important: This should be a direct path, not under /api
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});


// Routes
app.use('/api/events', eventRoutes);
app.use('/api/rsvps', rsvpRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/tickets", ticketRoutes);

app.get("/", (req, res) => {
  res.send("hello world");
});


app.listen(PORT, () => {
  console.log(`app is listening on port https://localhost:${PORT}`);
});

export default app;