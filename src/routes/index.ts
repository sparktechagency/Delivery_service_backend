import express from 'express';
import parcelRoutes from '../app/modules/parcel/parcel.routes';
import deliveryRoutes from '../app/modules/parcel/delivery.routes';
import userRoutesProfile from './user.routes';
import adminRouter from '../app/modules/admin/admin.route';
import NotificationRoute from '../app/modules/notification/notification.route';
import subscription from '../app/modules/subscriptions/route';
import PaymentRoutes from '../app/modules/payments/payment.routes';
import UserActivityRoute from '../app/modules/user/user.activity.Routes';
import ReviewRoutes from '../app/modules/app-review/review.route';
import { RuleRoutes } from '../app/modules/rule/rule.route';

const router = express.Router();

const apiRoutes = [
  // { path: '/auth', route: AuthRoutes },
  { path: '/parcel', route: parcelRoutes },
  { path: '/delivery', route: deliveryRoutes },
  { path: '/user', route: userRoutesProfile },
  { path: '/admin', route: adminRouter },
  { path: '/notification', route: NotificationRoute},
  { path: '/admin/subscriptions', route: subscription},
  { path: '/payments', route: PaymentRoutes },
  { path: '/activity', route: UserActivityRoute },
  { path: '/review', route: ReviewRoutes },
  { path: '/rule', route: RuleRoutes }

  

];
apiRoutes.forEach(route => {
  if (route) {
    console.log(`Registering route: /api${route.path}`); // Debugging
    router.use(route.path, route.route);
  }
});

export default router;
