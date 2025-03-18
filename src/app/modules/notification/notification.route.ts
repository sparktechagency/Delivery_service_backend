import express, { Request, Response } from 'express';
import { sendRadiusNotification,viewNotifications } from './notification.controller';
import { authenticate } from '../../middlewares/auth';


const NotificationRoute = express.Router();


NotificationRoute.post('/parcel/create/notify-radius', authenticate, sendRadiusNotification);
NotificationRoute.get('/', authenticate,viewNotifications);
export default NotificationRoute;