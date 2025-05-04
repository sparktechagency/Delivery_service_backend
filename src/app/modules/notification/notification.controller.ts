import { NextFunction, Response, Request } from "express";
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
  
      users.forEach(user => {
        console.log(`Sending notification to ${user.fullName}: ${message}`);
      });
  
      res.json({ status: 'success', message: 'Notifications sent successfully' });
    } catch (error) {
      next(error);
    }
  };

  // export const viewNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  //   try {
  //     const userId = req.user?.id;  
      
  //     if (!userId) throw new AppError('Unauthorized', 401);  
  
  //     const userNotifications = await Notification.find({ userId }).sort({ createdAt: -1 });
  //     const announcement = await Notification.findOne({ type: 'announcement' });
  //     const user = await User.findById(userId).select('fullName');
  
  //     if (!user) {
  //       return res.status(404).json({
  //         status: 'error',
  //         message: 'User not found',
  //       });
  //     }
  
  //     const notifications = userNotifications || [];
  
  //     if (announcement) {
  //       notifications.push(announcement); 
  //     }
  
  //     res.status(200).json({
  //       status: 'success',
  //       data: notifications,  
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // };
  
  //
 
 
 
  export const viewNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { excludeTypes, page = 1, limit = 10 } = req.query;
      
      if (!userId) throw new AppError('Unauthorized', 401);
  
      let query: any = { userId };
      
      if (excludeTypes) {
        const typesToExclude = Array.isArray(excludeTypes) 
          ? excludeTypes 
          : [excludeTypes];
        
        query.type = { $nin: typesToExclude };
      } else {
        query.type = { $ne: 'Sender' };
      }
  
      // Calculate pagination
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;
  
      const userNotifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
        const announcements = await Notification.find({ 
        type: 'announcement',
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }).sort({ createdAt: -1 });
  
      // Get user info
      const user = await User.findById(userId).select('fullName');
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }
  
      // Combine user notifications and announcements
      let notifications = [...userNotifications];
      
      if (announcements.length > 0) {
        notifications = [...notifications, ...announcements];
        // Re-sort to ensure correct order after combining
        notifications.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
  
      // Get total count for pagination
      const totalCount = await Notification.countDocuments(query);
  
      res.status(200).json({
        status: 'success',
        data: notifications,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalItems: totalCount,
          itemsPerPage: limitNum
        }
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
  
      const newAnnouncement = new Notification({
        message: `New Announcement: ${title}`,
        type: 'announcement',
        title: title,
        description: description,
        isRead: false,  
      });
  
      await newAnnouncement.save();
  
      res.status(200).json({
        status: 'success',
        message: 'Announcement created and saved globally',
        data: newAnnouncement,
      });
    } catch (error) {
      next(error);
    }
  };


  export const getAllAnnouncements = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== 'admin') {
        throw new AppError('Unauthorized, admin access required', 403);
      }
  
      const announcements = await Notification.find({ type: 'announcement' })
        .sort({ createdAt: -1 }); 
  
      if (!announcements.length) {
        throw new AppError('No announcements found', 404);
      }
  
      res.status(200).json({
        status: 'success',
        data: announcements,  
      });
    } catch (error) {
      next(error);
    }
  };

  export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
  
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized. User ID is missing.',
        });
      }
  
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })  
        .exec();
  
      if (!notifications || notifications.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'No notifications found.',
        });
      }
  
      res.status(200).json({
        status: 'success',
        data: notifications,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal Server Error.',
      });
      next(error);
    }
  };

  export const getParcelNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
  
      if (!userId) throw new AppError('Unauthorized', 401);
  
      // Fetch notifications related to parcel creation, assuming type is 'Sender' (you can adjust the type if needed)
      const parcelNotifications = await Notification.find({
        userId,
        type: 'Sender', // Notifications triggered by parcel creation
      }).sort({ createdAt: -1 }); // Sort by latest first
  
      // Handle case when there are no notifications
      if (parcelNotifications.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'No parcel-related notifications found.',
        });
      }
  
      res.status(200).json({
        status: 'success',
        data: parcelNotifications,
      });
    } catch (error) {
      next(error);
    }
  };
  