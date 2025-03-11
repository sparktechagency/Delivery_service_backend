import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { checkSubscription } from './createsubscription';
import { getUserData } from '../admin/admin.controller';
// import { assignSubscriptionToUser } from './assignOrUpdateUser.controller';
import { UserRole } from '../../../types/enums';
import { assignUserSubscription, createGlobalSubscriptionPlan, getAllGlobalSubscriptions, updateGlobalSubscriptionPrice,  } from './createsubscription';

const subscription = express.Router();

// Protect route with subscription check
subscription.get('/user-data', authenticate, checkSubscription, getUserData);
subscription.get('/globalsubscription', authenticate,getAllGlobalSubscriptions )
subscription.put('/assign-user-subscription', authenticate, authorize(UserRole.ADMIN), assignUserSubscription);
// subscription.put('/update-user-subscription', authenticate, authorize(UserRole.ADMIN), updateUserSubscription);
subscription.put('/update-price', authenticate, authorize(UserRole.ADMIN), updateGlobalSubscriptionPrice);
subscription.post('/createsubscription', authenticate, createGlobalSubscriptionPlan)

export default subscription;
