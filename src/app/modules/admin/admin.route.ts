import express from 'express';
import { authenticate, authorize } from "../../middlewares/auth";
// import upload from "../app/modules/";
import { changeAdminPassword, createAdmin, getAdminProfile, getOrders, getParcelDetails, getReports, getUsers, holdUser, loginAdmin, manageSubscriptions, updateAdminProfile, } from "./admin.controller";
import { UserRole } from "../../../types/enums";
import multer from 'multer';
import { assignFreeDeliveriesToUser, updateGlobalFreeDeliveries } from '../parcel/delivery.controller';
// import { getSubscriptionRevenue } from './report.controller';
import { getTransactionSummary } from './transection.controller';
import { getMostUsedDeliveryType, getNewSubscribers, getNewUsers, getTotalCompletedOrders, getTotalOrders, getTotalRevenue, getTotalSubscribers, getTotalSubscriptionRevenue, getTotalUsers, getTransactions, getUserRatingCounts } from './report.controller';
import { getAllAnnouncements } from '../notification/notification.controller';

const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Add your file filtering logic here
  cb(null, true);
};

const storage = multer.memoryStorage(); // Store file in memory buffer
const upload = multer({ storage });

const adminRouter = express.Router();
adminRouter.post('/create', authenticate, authorize(UserRole.ADMIN), upload.single('image'), createAdmin);
adminRouter.post('/login', loginAdmin);
// adminRouter.put('/profile/:id', authenticate, authorize(UserRole.ADMIN), upload.single('image'), updateAdminProfile);

// Route to update admin profile (authenticate, authorize, upload image, then update profile)
adminRouter.put('/profile/:id', authenticate, upload.single('profileImage'), updateAdminProfile);
adminRouter.put('/change-password', authenticate, authorize(UserRole.ADMIN), changeAdminPassword);

adminRouter.get('/profile', authenticate, authorize(UserRole.ADMIN), getAdminProfile);
adminRouter.post('/login', loginAdmin);

// Order Management
adminRouter.get('/orders', authenticate, authorize(UserRole.ADMIN), getOrders);

//assign delivery global and single user free routes
adminRouter.post('/global-free-Delivery', authenticate, updateGlobalFreeDeliveries );
adminRouter.post('/single-free-delivery', authenticate, assignFreeDeliveriesToUser );
// User Management
adminRouter.get('/users', authenticate, authorize(UserRole.ADMIN), getUsers);
adminRouter.post('/users/hold', authenticate, authorize(UserRole.ADMIN), holdUser);

// Report Management
adminRouter.get('/reports', authenticate, authorize(UserRole.ADMIN), getReports);
adminRouter.get('/totalRevenue', getTotalRevenue);
adminRouter.get('/totalSubscriptionRevenue', getTotalSubscriptionRevenue);
adminRouter.get('/totalUsers', getTotalUsers);
adminRouter.get('/newUsers', getNewUsers);
adminRouter.get('/totalSubscribers', getTotalSubscribers);
adminRouter.get('/newSubscribers', getNewSubscribers);
adminRouter.get('/totalOrders', getTotalOrders);
adminRouter.get('/totalCompletedOrders', getTotalCompletedOrders);
adminRouter.get('/transectionSummary', authenticate, authorize(UserRole.ADMIN),getTransactionSummary );
adminRouter.get('/transection', authenticate, authorize(UserRole.ADMIN), getTransactions);
//parcel status
adminRouter.get('/parcel-status', authenticate, authorize(UserRole.ADMIN), getParcelDetails);

// Subscription Management
adminRouter.post('/subscriptions', authenticate, authorize(UserRole.ADMIN), manageSubscriptions);


//get all announcement admin
adminRouter.get('/announcements', authenticate, authorize(UserRole.ADMIN), getAllAnnouncements);

//get most DeliveryType like car, bike etc
adminRouter.get('/delivery-type', authenticate, authorize(UserRole.ADMIN), getMostUsedDeliveryType);

//rating user
adminRouter.get('/rating-user', authenticate, authorize(UserRole.ADMIN), getUserRatingCounts);

export default adminRouter;