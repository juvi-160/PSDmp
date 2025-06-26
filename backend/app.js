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

dotenv.config({ path: path.join(__dirname, '../config/.env') });


const app = express();
app.set('trust proxy', 1);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully!");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

testConnection();

async function syncDb() {
  try {
    // Use force: false and alter: false for production
    // Only use alter: true in development
    const isDevelopment = process.env.NODE_ENV !== "production"

    await sequelize.sync({
      force: false,
      alter: isDevelopment, // Only alter in development
    })
    console.log("All models were synchronized successfully.")
  } catch (error) {
    console.error("Error synchronizing models:", error)
  }
}
//syncDb()


// Middleware
const allowedOrigins = [
  "https://join.psfhyd.org",
  "http://localhost:4200",
  "https://api.psfhyd.org",
  "http://localhost:3000", // Add localhost for development
  process.env.FRONTEND_URL, // Add environment variable for flexibility
].filter(Boolean) // Remove undefined values

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        console.log("Blocked by CORS:", origin)
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  }),
)


app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
)

app.use(express.json());
app.use(morgan('dev'));

// Important: This should be a direct path, not under /api
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // More lenient in development
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
})

// Apply rate limiting to API routes
app.use("/api/", apiLimiter)



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
  console.log(`app is listening on port http://localhost:${PORT}`);
});

export default app;