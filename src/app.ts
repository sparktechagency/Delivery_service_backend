
// import express from 'express';
// import cors from 'cors';
// import { connectDB } from './config/index';
// import authRoutes from './app/modules/user/auth.Routes';
// import deliveryRoutes from './app/modules/parcel/delivery.routes';
// import { errorHandler } from './app/middlewares/error';
// import parcelRoutes from './app/modules/parcel/parcel.routes';
// import userRoutesProfile from './routes/user.routes';
// import adminRouter from './app/modules/admin/admin.route';
// import apiRoutes from './routes/index';
// import path from 'path';
// import stripeWebhook from './app/modules/payments/webhhok';
// const app = express();
// // app.use("/uploads/profiles", express.static(path.resolve(__dirname, "../../../uploads/profiles")));
// app.use("/uploads/profiles", express.static(path.resolve(__dirname, "../../../uploads/profiles")));
// // Connect to MongoDB
// connectDB();

// app.post(
//   "/api/payments/webhook",
//   express.raw({ type: "application/json" }),  // Ensure the raw body is used for webhook verification
//   stripeWebhook
// );


// app.use(cors());
// app.use(express.json());



// app.use(cors({
//     origin: ["http://10.0.70.213:4000", "http://localhost:4000" ,"https://ivan-parcel-delivery.vercel.app/auth/login"],
//     credentials: true
//   }));
//   app.use(cors({
//     origin: ["http://localhost:3000/api"], // Make sure the client domain is allowed
//     credentials: true,
//   }))

// app.use((req, res, next) => {
//   if (req.originalUrl === "/api/payments/webhook") {
//     next();
//   } else {
//     express.json()(req, res, next);
//   }
// });



// // Routes
// app.use('/api/auth', authRoutes);
// // app.use('/api/delivery', deliveryRoutes);
// app.use('/api', apiRoutes);




// // Error handling
// app.use(errorHandler);

// export default app;


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
import { User } from './app/modules/user/user.model';
import fs from 'fs';
import { createServer, Server } from 'http';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

connectDB();

app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

app.use(cors({
  origin: [
    "http://10.0.70.213:4000", 
    "http://localhost:4000", 
    "https://ivan-parcel-delivery.vercel.app",
    "http://localhost:3000"
  ],
  credentials: true
}));

app.use((req, res, next) => {
  if (req.originalUrl === "/api/payments/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Routes
app.get('/', (req, res) => {
  console.log('Server is beep beep');
  res.send('Server is beep beep');
});
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.post('/api/save-fcm-token', async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user?.id; 

    await User.updateOne({ _id: userId }, { $set: { fcmToken: token } });

    res.status(200).json({ message: 'FCM token saved successfully' });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({ message: 'Failed to save FCM token' });
  }
});


const SocketPort = process.env.SocketPort || "5000";
const server = createServer(app);
const io = new Server(server);
io.on("headers", (headers, req) => {
  headers["Access-Control-Allow-Origin"] = "*"; 
});


io.on("connection", (socket: any) => {
  console.log("⚡ New client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

server.listen(SocketPort, () => {
  // console.log(`🚀 Server & Socket.io running on http://10.0.70.208:${PORT}`);
  console.log(`🚀 Server & Socket.io running:${SocketPort}`);
});

// Error handling
app.use(errorHandler);

export default app;