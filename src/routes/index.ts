import express from 'express';
import parcelRoutes from '../app/modules/parcel/parcel.routes';
import deliveryRoutes from '../app/modules/parcel/delivery.routes';
import userRoutesProfile from './user.routes';
import adminRouter from '../app/modules/admin/admin.route';
import NotificationRoute from './notification';
import subscription from '../app/modules/subscriptions/route';
import PaymentRoutes from '../app/modules/payments/payment.routes';

const router = express.Router();

const apiRoutes = [
  // { path: '/auth', route: AuthRoutes },
  { path: '/parcel', route: parcelRoutes },
  { path: '/delivery', route: deliveryRoutes },
  { path: '/user', route: userRoutesProfile },
  { path: '/admin', route: adminRouter },
  { path: '/notification', route: NotificationRoute},
  { path: '/admin/subscriptions', route: subscription},
  { path: '/payments', route: PaymentRoutes }
  

];
apiRoutes.forEach(route => {
  if (route) {
    console.log(`Registering route: /api${route.path}`); // Debugging
    router.use(route.path, route.route);
  }
});

export default router;
