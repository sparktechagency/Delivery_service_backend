import express from 'express';
import cors from 'cors';
import { connectDB } from './config/index';
import authRoutes from './routes/auth';
import deliveryRoutes from './routes/delivery';
import { errorHandler } from './app/middlewares/error';

const app = express();


// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/delivery', deliveryRoutes);

// Error handling
app.use(errorHandler);

export default app;