import express from 'express';
import cors from 'cors';
import { connectDB } from './config/index';
import authRoutes from './routes/auth';
import deliveryRoutes from './routes/delivery.routes';
import { errorHandler } from './app/middlewares/error';
import parcelRoutes from './routes/parcel.routes';

const app = express();


// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
// app.use('/api/delivery', deliveryRoutes);
app.use('/api/parcel', parcelRoutes);
app.use('/api/delivery', deliveryRoutes);

// app.get('/api/delivery/test', (req, res) => {
//     res.send('Test route is working');
//   });
  


// Error handling
app.use(errorHandler);

export default app;