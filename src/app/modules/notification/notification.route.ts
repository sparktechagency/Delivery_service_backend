import express, { Request, Response } from 'express';
import { getNotifications, sendAnnouncement, sendRadiusNotification,viewNotifications } from './notification.controller';
import { authenticate, authorize } from '../../middlewares/auth';
import { UserRole } from '../../../types/enums';


const NotificationRoute = express.Router();


NotificationRoute.post('/parcel/create/notify-radius', authenticate, sendRadiusNotification);
NotificationRoute.get('/', authenticate,viewNotifications);
NotificationRoute.get('/push-notification', authenticate,getNotifications);

//admin notifications
NotificationRoute.post('/announcement', authenticate, authorize(UserRole.ADMIN),sendAnnouncement);
export default NotificationRoute;