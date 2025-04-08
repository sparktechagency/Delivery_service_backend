import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { checkSubscription, deleteSubscriptionById, getGlobalTrialDetailsForAdmin, setGlobalTrialPeriod } from './createsubscription';
import { getUserData } from '../admin/admin.controller';
// import { assignSubscriptionToUser } from './assignOrUpdateUser.controller';
import { UserRole } from '../../../types/enums';
import { assignUserSubscription, createGlobalSubscriptionPlan, getAllGlobalSubscriptions, updateSubscriptionById,  } from './createsubscription';

const subscription = express.Router();

// Protect route with subscription check
subscription.get('/user-data', authenticate, checkSubscription, getUserData);
subscription.get('/globalsubscription', authenticate,getAllGlobalSubscriptions )
subscription.put('/assign-user-subscription', authenticate, authorize(UserRole.ADMIN), assignUserSubscription);
// subscription.put('/update-user-subscription', authenticate, authorize(UserRole.ADMIN), updateUserSubscription);
subscription.put('/update-plan/:id', authenticate, authorize(UserRole.ADMIN),updateSubscriptionById );
subscription.post('/createsubscription', authenticate, createGlobalSubscriptionPlan)
subscription.post('/global-trial-period', authenticate, authorize(UserRole.ADMIN), setGlobalTrialPeriod);
subscription.get('/trial/details', authenticate, authorize(UserRole.ADMIN), getGlobalTrialDetailsForAdmin);
subscription.delete('/delete/:id', authenticate, deleteSubscriptionById)

export default subscription;
