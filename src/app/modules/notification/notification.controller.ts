import { NextFunction, Response } from "express";
import mongoose from "mongoose";
import { AppError } from "../../middlewares/error";
import { DeliveryStatus } from "../../../types";
import { AuthRequest } from "../../middlewares/auth";
import { User } from "../user/user.model";
import { Notification } from "./notification.model"; 

  export const sendRadiusNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { latitude, longitude, radius, message } = req.body;
  
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const rad = parseFloat(radius);
  
      if (isNaN(lat) || isNaN(lon) || isNaN(rad)) {
        throw new AppError('Latitude, longitude, and radius must be valid numbers', 400);
      }
  
      const users = await User.find({
        'location.latitude': { $gte: lat - rad, $lte: lat + rad },
        'location.longitude': { $gte: lon - rad, $lte: lon + rad }
      });
  
      // Implement notification logic
      users.forEach(user => {
        console.log(`Sending notification to ${user.fullName}: ${message}`);
      });
  
      res.json({ status: 'success', message: 'Notifications sent successfully' });
    } catch (error) {
      next(error);
    }
  };

  export const viewNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;  // Get the user ID from the request (from auth middleware)
      
      if (!userId) throw new AppError('Unauthorized', 401);  // If no user ID, return unauthorized error
  
      // Fetch all notifications for the user
      const userNotifications = await Notification.find({ userId }).sort({ createdAt: -1 });
  
      // Fetch the global announcement (if it exists)
      const announcement = await Notification.findOne({ type: 'announcement' });
  
      // Include the global announcement with the user's notifications
      const notifications = userNotifications || [];
  
      if (announcement) {
        notifications.push(announcement);  // Add the global announcement to the list
      }
  
      res.status(200).json({
        status: 'success',
        data: notifications,  // Return the user's notifications and global announcement
      });
    } catch (error) {
      next(error);
    }
  };

  export const sendAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { title, description } = req.body;
  
      if (!title || !description) {
        throw new AppError('Title and description are required', 400);
      }
  
      // Create a new announcement (multiple announcements allowed)
      const newAnnouncement = new Notification({
        message: `New Announcement: ${title}`,
        type: 'announcement',
        title: title,
        description: description,
        isRead: false,  // Initially, users will see it as unread
      });
  
      // Save the new announcement
      await newAnnouncement.save();
  
      res.status(200).json({
        status: 'success',
        message: 'Announcement created and saved globally',
        data: newAnnouncement, // Return the newly created announcement
      });
    } catch (error) {
      next(error);
    }
  };

  //all announcements admin
  export const getAllAnnouncements = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is an admin
      if (req.user?.role !== 'admin') {
        throw new AppError('Unauthorized, admin access required', 403);
      }
  
      // Fetch all notifications of type 'announcement'
      const announcements = await Notification.find({ type: 'announcement' })
        .sort({ createdAt: -1 });  // Sort by most recent
  
      if (!announcements.length) {
        throw new AppError('No announcements found', 404);
      }
  
      res.status(200).json({
        status: 'success',
        data: announcements,  // Return the fetched announcements
      });
    } catch (error) {
      next(error);
    }
  };