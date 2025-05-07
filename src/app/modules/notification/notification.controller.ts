import { NextFunction, Response, Request } from "express";
import mongoose from "mongoose";
import { AppError } from "../../middlewares/error";
import { DeliveryStatus } from "../../../types";
import { AuthRequest } from "../../middlewares/auth";
import { User } from "../user/user.model";
import { Notification } from "./notification.model"; 
import admin from "../../../config/firebase";
import DeviceToken from "../user/fcm.token.model";
import { ParcelRequest } from "../parcel/ParcelRequest.model";
import { console } from "inspector";

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

  // export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const userId = req.user?.id;
  
  //     if (!userId) {
  //       return res.status(401).json({
  //         status: 'error',
  //         message: 'Unauthorized. User ID is missing.',
  //       });
  //     }
  
  //     const notifications = await Notification.find({ userId })
  //       .sort({ createdAt: -1 })  
  //       .exec();
  
  //     if (!notifications || notifications.length === 0) {
  //       return res.status(404).json({
  //         status: 'error',
  //         message: 'No notifications found.',
  //       });
  //     }
  
  //     res.status(200).json({
  //       status: 'success',
  //       data: notifications,
  //     });
  //   } catch (error) {
  //     console.error('Error fetching notifications:', error);
  //     res.status(500).json({
  //       status: 'error',
  //       message: 'Internal Server Error.',
  //     });
  //     next(error);
  //   }
  // };

  export const sendPushNotification = async (
    userIds: string[],
    notification: { title: string; body: string },
    data: Record<string, string>
  ) => {
    try {
      // Fetch the FCM tokens from the DeviceToken collection based on userIds
      const deviceTokens = await DeviceToken.find({
        userId: { $in: userIds },
        fcmToken: { $exists: true, $ne: '' },
      }).select('fcmToken userId');
  
      if (deviceTokens.length === 0) {
        console.log('No valid FCM tokens found');
        return;
      }
  
      // Deduplicate by userId and map to send messages
      const uniqueUserIds = Array.from(new Set(deviceTokens.map(token => userIds.toString())) );
      const messages = deviceTokens.map(token => ({
        notification,
        data,
        token: token.fcmToken, // Ensure one token per user
       
      }));
      console.log(uniqueUserIds);
  
      // Send notifications in batches of 500 (FCM limit)
      const batchSize = 500;
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        const responses = await Promise.all(batch.map(message => admin.messaging().send(message)));
        console.log(`Batch ${Math.floor(i / batchSize) + 1}: Sent ${responses.length} push notifications`);
      }
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  };
  

/**
 * Create a new notification and send push notification
 */
export const createNotification = async (
userIds: string[], message: string, type: string, title: string, additionalData: {
  phoneNumber?: string;
  mobileNumber?: string;
  price?: number;
  description?: string;
  image?: string;
  parcelId?: string;
} = {}, as: any, NotificationData: any) => {
  try {
    if (!userIds || userIds.length === 0) {
      console.log('No users to notify');
      return;
    }

    // Ensure unique notification creation for each user
    const notificationPromises = userIds.map(async (userId) => {
      const existingNotification = await Notification.findOne({
        userId,
        type,
        parcelId: additionalData.parcelId,  // Ensure it relates to this specific parcel
      });

      if (existingNotification) {
        console.log(`Notification already exists for user ${userId}, skipping.`);
        return null;  // Skip creating a new notification if it already exists
      }

      // If no existing notification, create and save the new notification
      const notification = new Notification({
        userId,
        message,
        type,
        title,
        phoneNumber: additionalData.phoneNumber || '',
        mobileNumber: additionalData.mobileNumber || '',
        price: additionalData.price || 0,
        description: additionalData.description || '',
        image: additionalData.image || '',
        isRead: false
      });

      return notification.save();  // Save the new notification to the database
    });

    // Filter out any null promises (for skipped notifications) and await the rest
    const results = await Promise.all(notificationPromises.filter(Boolean));

    console.log(`Created ${results.length} database notifications`);

    // After database notification creation, send the push notifications
    await sendPushNotification(
      userIds,
      { title, body: message },
      {
        type,
        title,
        message,
        phoneNumber: additionalData.phoneNumber || '',
        description: additionalData.description || '',
        parcelId: additionalData.parcelId || '',
        ...Object.entries(additionalData)
          .filter(([_, value]) => value !== undefined)
          .reduce((acc, [key, value]) => ({ ...acc, [key]: String(value) }), {})
      }
    );
  } catch (error) {
    console.error('Error creating notifications:', error);
  }
};




/**
 * Get all non-parcel notifications for a user
 */
export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Modify the query to include specific types of notifications related to parcels
    const query = { 
      userId,
      type: { 
        $in: ['Requested-Delivery', 'Accepted', 'Cancelled', 'Rejected', 'Recciver'] // Include specific parcel-related types
      }
    };

    // Get total count for pagination
    const totalCount = await Notification.countDocuments(query);

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      status: 'success',
      data: {
        notifications,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notifications'
    });
    next(error);
  }
};

export const getParcelNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    // Check if user has notifications enabled
    const user = await User.findById(userId).select('notificationStatus');


    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // If notificationStatus is false, don't show any notifications
    if (!user.notificationStatus) {
      return res.status(200).json({
        status: 'success',
        message: 'Notifications are disabled for this user.',
        data: {
          notifications: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            pages: 0
          }
        }
      });
    }

    // Proceed to fetch notifications if notificationStatus is true
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const totalCount = await Notification.countDocuments({
      userId,
      type: { $in: ['send_parcel', 'sender'] },
    });

    // Get parcel-related notifications with pagination
    const parcelNotifications = await Notification.find({
      userId,
      type: { $in: ['send_parcel', 'sender'] },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Handle case when there are no notifications
    if (parcelNotifications.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No parcel-related notifications found.',
        data: {
          notifications: [],
          pagination: {
            total: 0,
            page,
            limit,
            pages: 0
          }
        }
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        notifications: parcelNotifications,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching parcel notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch parcel notifications'
    });
    next(error);
  }
};
export const updateNotificationStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { notificationStatus } = req.body; // `notificationStatus` should be a boolean value

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    // Check if notificationStatus is provided and is a boolean
    if (typeof notificationStatus !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'notificationStatus should be a boolean value'
      });
    }

    // Update the notificationStatus for the user
    const user = await User.findByIdAndUpdate(
      userId,
      { notificationStatus },
      { new: true }
    ).select('notificationStatus');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Notification status updated successfully.`,
      data: user
    });
  } catch (error) {
    console.error('Error updating notification status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update notification status'
    });
    next(error);
  }
};

