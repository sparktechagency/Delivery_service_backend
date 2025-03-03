import express from 'express';
import cors from 'cors';
import { connectDB } from './config/index';
import authRoutes from './routes/auth';
import deliveryRoutes from './routes/delivery.routes';
import { errorHandler } from './app/middlewares/error';
import parcelRoutes from './routes/parcel.routes';
import userRoutesProfile from './routes/user.routes';
import adminRouter from './routes/admin';

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
app.use('/api/user',userRoutesProfile )
app.use('/api/admin',adminRouter )

// app.get('/api/delivery/test', (req, res) => {
//     res.send('Test route is working');
//   });
  


// Error handling
app.use(errorHandler);

export default app;