import express from 'express';
import { authenticate, authorize } from "../app/middlewares/auth";
// import upload from "../app/modules/";
import { changeAdminPassword, createAdmin, getAdminProfile, getOrders, getReports, getUsers, holdUser, loginAdmin, manageSubscriptions, updateAdminProfile } from "../app/modules/admin/admin.controller";
import { UserRole } from "../types";
import multer from 'multer';

const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Add your file filtering logic here
  cb(null, true);
};

const storage = multer.memoryStorage(); // Store file in memory buffer
const upload = multer({ storage });

const adminRouter = express.Router();
adminRouter.post('/create', authenticate, authorize(UserRole.ADMIN), upload.single('image'), createAdmin);
adminRouter.post('/login', loginAdmin);
adminRouter.put('/profile/:id', authenticate, authorize(UserRole.ADMIN), upload.single('image'), updateAdminProfile);
adminRouter.put('/change-password', authenticate, authorize(UserRole.ADMIN), changeAdminPassword);
adminRouter.get('/profile', authenticate, authorize(UserRole.ADMIN), getAdminProfile);
adminRouter.post('/login', loginAdmin);

// Order Management
adminRouter.get('/orders', authenticate, authorize(UserRole.ADMIN), getOrders);

// User Management
adminRouter.get('/users', authenticate, authorize(UserRole.ADMIN), getUsers);
adminRouter.post('/users/hold', authenticate, authorize(UserRole.ADMIN), holdUser);

// Report Management
adminRouter.get('/reports', authenticate, authorize(UserRole.ADMIN), getReports);

// Subscription Management
adminRouter.post('/subscriptions', authenticate, authorize(UserRole.ADMIN), manageSubscriptions);

export default adminRouter;