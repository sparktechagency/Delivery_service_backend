import express, { Request, Response } from 'express';
import { getNotifications, getParcelNotifications, markAllNotificationsAsRead, sendAnnouncement, sendRadiusNotification,updateNotificationStatus,viewNotifications } from './notification.controller';
import { authenticate, authorize } from '../../middlewares/auth';
import { UserRole } from '../../../types/enums';


const NotificationRoute = express.Router();


NotificationRoute.post('/parcel/create/notify-radius', authenticate, sendRadiusNotification);
NotificationRoute.get('/', authenticate,viewNotifications);
NotificationRoute.get('/all-notification', authenticate,getNotifications);
NotificationRoute.get('/parcelNotify', authenticate,getParcelNotifications);
NotificationRoute.patch('/update-status', authenticate,updateNotificationStatus);
NotificationRoute.patch('/mark-read', authenticate, markAllNotificationsAsRead );

//admin notifications
NotificationRoute.post('/announcement', authenticate, authorize(UserRole.ADMIN),sendAnnouncement);
export default NotificationRoute;