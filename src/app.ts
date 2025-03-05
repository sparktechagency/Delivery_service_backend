import express from 'express';
import cors from 'cors';
import { connectDB } from './config/index';
import authRoutes from './routes/auth';
import deliveryRoutes from './routes/delivery.routes';
import { errorHandler } from './app/middlewares/error';
import parcelRoutes from './routes/parcel.routes';
import userRoutesProfile from './routes/user.routes';
import adminRouter from './routes/admin';
import apiRoutes from './routes/index';
import path from 'path';
const app = express();


// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());
app.use(cors({
    origin: ["http://10.0.70.213:4000", "http://localhost:4000"],
    credentials: true
  }));
  app.use(cors({
    origin: ["http://localhost:3000"], // Make sure the client domain is allowed
    credentials: true,
  }))
//image get
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// Routes
app.use('/api/auth', authRoutes);
// app.use('/api/delivery', deliveryRoutes);
app.use('/api', apiRoutes);

// app.get('/api/delivery/test', (req, res) => {
//     res.send('Test route is working');
//   });
  


// Error handling
app.use(errorHandler);

export default app;