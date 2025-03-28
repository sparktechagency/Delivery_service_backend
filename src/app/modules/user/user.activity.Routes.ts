
import express from 'express';

import { trackUserActivity, getUserActivityReport, getUserProfileAndParcels } from './user.activity.controller';
import { authenticate, authorize, } from '../../middlewares/auth';
import { UserRole } from '../../../types/enums';

const UserActivityRoute = express.Router();
UserActivityRoute.use(trackUserActivity); 
UserActivityRoute.get('/user-report', getUserActivityReport);
UserActivityRoute.get('/all/:userId',authenticate , authorize(UserRole.ADMIN), getUserProfileAndParcels)

export default UserActivityRoute;