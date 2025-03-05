import express from 'express';
import parcelRoutes from './parcel.routes';
import deliveryRoutes from './delivery.routes';
import userRoutesProfile from './user.routes';
import adminRouter from './admin';

const router = express.Router();

const apiRoutes = [
  // { path: '/auth', route: AuthRoutes },
  { path: '/parcel', route: parcelRoutes },
  { path: '/delivery', route: deliveryRoutes },
  { path: '/user', route: userRoutesProfile },
  { path: '/admin', route: adminRouter },
  

];
apiRoutes.forEach(route => {
  if (route) {
    console.log(`Registering route: /api${route.path}`); // Debugging
    router.use(route.path, route.route);
  }
});

export default router;
