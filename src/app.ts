import express from 'express';
import cors from 'cors';
import { connectDB } from './config/index';
import authRoutes from './app/modules/user/auth.Routes';
import deliveryRoutes from './app/modules/parcel/delivery.routes';
import { errorHandler } from './app/middlewares/error';
import parcelRoutes from './app/modules/parcel/parcel.routes';
import userRoutesProfile from './routes/user.routes';
import adminRouter from './app/modules/admin/admin.route';
import apiRoutes from './routes/index';
import path from 'path';
import stripeWebhook from './app/modules/payments/webhhok';
const app = express();

// Connect to MongoDB
connectDB();

app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),  // Ensure the raw body is used for webhook verification
  stripeWebhook
);


app.use(cors());
app.use(express.json());



app.use(cors({
    origin: ["http://10.0.70.213:4000", "http://localhost:4000" ,"https://ivan-parcel-delivery.vercel.app/auth/login"],
    credentials: true
  }));
  app.use(cors({
    origin: ["http://localhost:3000/api"], // Make sure the client domain is allowed
    credentials: true,
  }))
//image get
// app.use("/uploads/profiles", express.static(path.resolve(__dirname, "../../../uploads/profiles")));
app.use("/uploads/profiles", express.static(path.resolve(__dirname, "../../../uploads/profiles")));

app.use((req, res, next) => {
  if (req.originalUrl === "/api/payments/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});



// Routes
app.use('/api/auth', authRoutes);
// app.use('/api/delivery', deliveryRoutes);
app.use('/api', apiRoutes);




// Error handling
app.use(errorHandler);

export default app;