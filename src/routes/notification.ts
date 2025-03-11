import express, { Request, Response } from 'express';
import { sendRadiusNotification } from '../app/modules/notification/notification';
import { viewNotifications } from '../app/modules/user/auth.controllers';

const NotificationRoute = express.Router();


NotificationRoute.post('/parcel/create/notify-radius', sendRadiusNotification);
NotificationRoute.get('/notifications', viewNotifications);
export default NotificationRoute;