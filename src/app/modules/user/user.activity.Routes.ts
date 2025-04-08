
import express from 'express';

import { trackUserActivity, getUserActivityReport, getUserProfileAndParcels } from './user.activity.controller';
import { authenticate, authorize, } from '../../middlewares/auth';
import { UserRole } from '../../../types/enums';
import { getRemainingSubscriptionTrialDays } from './user.profile';

const UserActivityRoute = express.Router();
UserActivityRoute.use(trackUserActivity); 
UserActivityRoute.get('/user-report', getUserActivityReport);
UserActivityRoute.get('/all/:userId',authenticate , authorize(UserRole.ADMIN), getUserProfileAndParcels)
UserActivityRoute.get('/expiryDate',authenticate,getRemainingSubscriptionTrialDays ); // Get user activity report by expiry date
export default UserActivityRoute;