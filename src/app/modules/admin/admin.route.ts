import express from 'express';
import { authenticate, authorize } from "../../middlewares/auth";
import { changeAdminPassword, createAdmin, deleteUser, getAdminProfile, getOrderDetails, getOrders, getParcelDetails, getParcelDetailsById, getReports, getUsers, holdUser, loginAdmin, manageSubscriptions, updateAdminProfile, } from "./admin.controller";
import { UserRole } from "../../../types/enums";
import multer from 'multer';
import { assignFreeDeliveriesToUser, updateGlobalFreeDeliveries } from '../parcel/delivery.controller';
import { getTransactionSummary } from './transection.controller';
import { getMostUsedDeliveryType, getNewSubscribers, getNewUsers, getTotalCompletedOrders, getTotalOrders, getTotalOrdersNumber, getTotalRevenue, getTotalRevenueNumber, getTotalSubscribers, getTotalSubscribersNumber, getTotalSubscriptionRevenue, getTotalUsers, getTransactions, getTransactionsTotal, getUserRatingCounts, getUserStatistics } from './report.controller';
import { getAllAnnouncements } from '../notification/notification.controller';
import { trackUserActivity } from '../user/user.activity.controller';

const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {

  cb(null, true);
};

const storage = multer.memoryStorage();
const upload = multer({ storage });

const adminRouter = express.Router();
adminRouter.post('/create', upload.single('image'), createAdmin);
adminRouter.post('/login', loginAdmin);
adminRouter.put('/profile/:id', authenticate, updateAdminProfile);
adminRouter.put('/change-password', authenticate, authorize(UserRole.ADMIN), changeAdminPassword);
adminRouter.delete('/user/:userId', authenticate, authorize(UserRole.ADMIN), deleteUser);
adminRouter.get('/profile', authenticate, authorize(UserRole.ADMIN), getAdminProfile);
adminRouter.post('/login', loginAdmin);

// Order Management
adminRouter.get('/orders', authenticate, authorize(UserRole.ADMIN), getOrders);

//assign delivery global and single user free routes
adminRouter.post('/global-free-Delivery', authenticate, updateGlobalFreeDeliveries );
adminRouter.post('/single-free-delivery', authenticate, assignFreeDeliveriesToUser );
// User Management
adminRouter.get('/users', authenticate, authorize(UserRole.ADMIN), getUsers);
adminRouter.get('/parcel/:parcelId', authenticate, authorize(UserRole.ADMIN), getParcelDetailsById);
adminRouter.post('/users/hold', authenticate, authorize(UserRole.ADMIN), holdUser);

// Report Management
adminRouter.get('/reports', authenticate, authorize(UserRole.ADMIN), getReports);
adminRouter.get('/totalRevenue', getTotalRevenue);
adminRouter.get('/totalRevenue/number', getTotalRevenueNumber);
adminRouter.get('/totalSubscriptionRevenue', getTotalSubscriptionRevenue);
adminRouter.get('/totalUsers', getTotalUsers);
adminRouter.get('/newUsers', getNewUsers);
adminRouter.get('/totalSubscribers', getTotalSubscribers);
adminRouter.get('/totalSubscribers/total', getTotalSubscribersNumber);
adminRouter.get('/newSubscribers', getNewSubscribers);
adminRouter.get('/totalOrders', getTotalOrders);
adminRouter.get('/totalOrders/number', getTotalOrdersNumber);
adminRouter.get('/totalCompletedOrders', getTotalCompletedOrders);
adminRouter.get('/transectionSummary', authenticate, authorize(UserRole.ADMIN),getTransactionSummary );
adminRouter.get('/transection', authenticate, authorize(UserRole.ADMIN), getTransactions);
adminRouter.get('/transection/total', authenticate, authorize(UserRole.ADMIN), getTransactionsTotal);
//parcel status
adminRouter.get('/parcel-status', authenticate, authorize(UserRole.ADMIN), getParcelDetails);
adminRouter.get('/order-details', authenticate, authorize(UserRole.ADMIN), getOrderDetails);

// Subscription Management
adminRouter.post('/subscriptions', authenticate, authorize(UserRole.ADMIN), manageSubscriptions);

//get all announcement admin
adminRouter.get('/announcements', authenticate, authorize(UserRole.ADMIN), getAllAnnouncements);

//get most DeliveryType like car, bike etc
adminRouter.get('/delivery-type', authenticate, authorize(UserRole.ADMIN), getMostUsedDeliveryType);

//rating user
adminRouter.get('/rating-user', authenticate, authorize(UserRole.ADMIN), getUserRatingCounts);
adminRouter.get('/track-user-activity', authenticate, authorize(UserRole.ADMIN), trackUserActivity);
adminRouter.get('/user-satistics', authenticate, authorize(UserRole.ADMIN), getUserStatistics);
adminRouter.get('/star-rating', authenticate, authorize(UserRole.ADMIN), getUserRatingCounts);

export default adminRouter;