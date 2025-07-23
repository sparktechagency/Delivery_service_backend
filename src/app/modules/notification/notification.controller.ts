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
import PushNotification from "./push.notification.model";

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


 
  export const viewNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
         res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
        return;
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
      if (req.user?.role !== 'ADMIN') {
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



export const sendPushNotification = async (
  userIds: string[],
  notification: { title: string; body: string },
  data: Record<string, string>
) => {
  try {
    if (!userIds || userIds.length === 0) {
      console.log('No users to send push notifications to');
      return;
    }

    console.log(`Fetching device tokens for users: ${userIds}`);

    const deviceTokens = await DeviceToken.find({
      userId: { $in: userIds },
      fcmToken: { $exists: true, $ne: '' }
    }).select('fcmToken userId');

    console.log(`Found ${deviceTokens.length} valid FCM tokens for ${userIds.length} users`);

    if (deviceTokens.length === 0) {
      console.log('No valid FCM tokens found, skipping push notifications');
      return;
    }

    const validTokens = deviceTokens.filter(dt =>
      dt.fcmToken && dt.fcmToken.length > 10 && dt.fcmToken.indexOf(' ') === -1
    );

    if (validTokens.length !== deviceTokens.length) {
      console.log(`Filtered out ${deviceTokens.length - validTokens.length} invalid tokens`);
    }

    const messages = validTokens.map(token => ({
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: data,
      token: token.fcmToken,
      android: {
        priority: "high" as "high",
        notification: {
          sound: 'default',
          priority: "high" as "high",
          channelId: 'default-channel'
        }
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
            sound: 'default',
            badge: 1
          }
        },
        headers: {
          "apns-priority": "10"
        }
      }
    }));

    if (messages.length === 0) {
      console.log('No valid messages to send');
      return;
    }

    const batchSize = 500;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      try {
        const sendPromises = batch.map(message => admin.messaging().send(message, true));
        const results = await Promise.all(sendPromises.map(p => p.catch(e => e)));

        const batchSuccesses = results.filter(r => !(r instanceof Error)).length;
        const batchFailures = results.filter(r => r instanceof Error).length;

        successCount += batchSuccesses;
        failureCount += batchFailures;

        console.log(`Batch ${Math.floor(i / batchSize) + 1}: Sent ${batchSuccesses} successful, ${batchFailures} failed notifications`);

        // Save notifications in DB for successful sends
        const successfulMessages = batch.filter((_, idx) => !(results[idx] instanceof Error));
        const notificationsToSave = successfulMessages.map((msg, idx) => ({
          userId: validTokens[i + idx].userId,
          fcmToken: validTokens[i + idx].fcmToken,
          title: msg.notification.title,
          body: msg.notification.body,
          data: msg.data,
          sentAt: new Date(),
        }));

        // Insert notifications in bulk
        if (notificationsToSave.length > 0) {
          await PushNotification.insertMany(notificationsToSave);
        }

        // Log errors and clean invalid tokens
        results.forEach((result, idx) => {
          if (result instanceof Error) {
            console.error(`Failed to send notification to token ${validTokens[i + idx]?.fcmToken?.substring(0, 10)}...: `,
              result.message);

            if (result.message && (
              result.message.includes('registration-token-not-registered') ||
              result.message.includes('invalid-registration-token'))) {
              const tokenToRemove = validTokens[i + idx];
              DeviceToken.deleteOne({ fcmToken: tokenToRemove.fcmToken }).catch(err => {
                console.error('Error removing invalid token:', err);
              });
            }
          }
        });
      } catch (batchError) {
        failureCount += batch.length;
        console.error(`Error sending batch ${Math.floor(i / batchSize) + 1}:`, batchError);
      }
    }

    console.log(`Push notification stats: ${successCount} succeeded, ${failureCount} failed`);
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
};
// Fixed createNotification function
export const createNotification = async (
  userIds: string[], 
  message: string, 
  type: string, 
  title: string, 
  additionalData: {
    phoneNumber?: string;
    mobileNumber?: string;
    price?: number;
    description?: string;
    image?: string;
    parcelId?: string;
    AvgRating?: number;
    name?: string;
  } = {},
  pickupLocationAddress?: string,
  pickupLocationCoords?: { latitude: number | undefined; longitude: number | undefined },
  deliveryLocationAddress?: string,
  deliveryLocationCoords?: { latitude: number | undefined; longitude: number | undefined }
) => {
  try {
    if (!userIds || userIds.length === 0) {
      console.log('No users to notify');
      return;
    }

    console.log(`Creating notifications for users: ${userIds}, type: ${type}, title: ${title}`);

    // Filter out users who have turned off notifications
    const usersWithNotificationsEnabled = await User.find({
      _id: { $in: userIds },
      notificationStatus: true
    }).select('_id');

    const enabledUserIds = usersWithNotificationsEnabled.map(user => user._id.toString());
    
    console.log(`${enabledUserIds.length} of ${userIds.length} users have notifications enabled`);
    
    if (enabledUserIds.length === 0) {
      console.log('All users have turned off notifications, skipping');
      return;
    }

    // Ensure unique notification creation for each user
    const notificationPromises = enabledUserIds.map(async (userId) => {
      // Check for existing notification to avoid duplicates
      const existingNotification = await Notification.findOne({
        userId,
        type,
        parcelId: additionalData.parcelId,  
      });

      if (existingNotification) {
        console.log(`Notification already exists for user ${userId}, skipping.`);
        return null;  
      }

      // Create new notification with all relevant data
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
        parcelId: additionalData.parcelId || '',
        pickupLocation: pickupLocationAddress || '',
        deliveryLocation: deliveryLocationAddress || '',
        isRead: false,
      });
      
      console.log(`Creating notification for user ${userId} with message: ${message}`);
      const savedNotification = await notification.save();
      console.log(`Notification created with ID: ${savedNotification._id}`);
      
      return savedNotification;
    });

    // Filter out any null promises (for skipped notifications) and await the rest
    const results = await Promise.all(notificationPromises.filter(Boolean));
    console.log(`Created ${results.length} database notifications`);

    // Prepare data for push notification with proper formatting
    const pushData: Record<string, string> = {
      type,
      title,
      message,
      notificationType: type // Add this for consistent filtering on client
    };

    // Add all additional data with proper string conversion
    Object.entries(additionalData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        pushData[key] = String(value);
      }
    });

    // Add location data if available with proper formatting
    if (pickupLocationCoords?.latitude && pickupLocationCoords?.longitude) {
      pushData.pickupLatitude = String(pickupLocationCoords.latitude);
      pushData.pickupLongitude = String(pickupLocationCoords.longitude);
    }
    
    if (deliveryLocationCoords?.latitude && deliveryLocationCoords?.longitude) {
      pushData.deliveryLatitude = String(deliveryLocationCoords.latitude);
      pushData.deliveryLongitude = String(deliveryLocationCoords.longitude);
    }

    if (pickupLocationAddress) {
      pushData.pickupLocationAddress = pickupLocationAddress;
    }

    if (deliveryLocationAddress) {
      pushData.deliveryLocationAddress = deliveryLocationAddress;
    }

    // Send push notifications
    await sendPushNotification(
      enabledUserIds,
      { title, body: message },
      pushData
    );
  } catch (error) {
    console.error('Error creating notifications:', error);
  }
};


export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
      return;
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

    // Format the deliveryStartTime and deliveryEndTime to ISO string
    const formattedNotifications = notifications.map(notification => {
      if (notification.deliveryStartTime) {
        notification.deliveryStartTime = new Date(notification.deliveryStartTime).toISOString();
      }
      if (notification.deliveryEndTime) {
        notification.deliveryEndTime = new Date(notification.deliveryEndTime).toISOString(); 
      }
      return notification;
    });

    res.status(200).json({
      status: 'success',
      data: {
        notifications: formattedNotifications,
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

export const getParcelNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> =>{
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }
    
    // Check if user has notifications enabled
    const user = await User.findById(userId).select('notificationStatus');
    if (!user) {
       res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }
    
    // If notificationStatus is false, don't show any notifications
    if (!user.notificationStatus) {
       res.status(200).json({
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
      return;
      
    }
    
    // Proceed to fetch notifications if notificationStatus is true
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
   

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
         res.status(401).json({ status: 'error', message: 'Invalid or missing user ID' });
         return;
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);

        const totalCount = await Notification.countDocuments({
          userId: userObjectId,
          type: { $in: ['send_parcel', 'sender', 'Requested-Delivery'] }
        });

        const parcelNotifications = await Notification.find({
          userId: userObjectId,
          type: { $in: ['send_parcel', 'sender', 'Requested-Delivery'] }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      console.log(`Found ${parcelNotifications.length} notifications for user ${userId}`);
    // Handle case when there are no notifications
    if (parcelNotifications.length === 0) {
       res.status(200).json({
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
    return;
  } catch (error) {
  console.error('Error fetching parcel notifications:', error);
  
  if (!res.headersSent) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch parcel notifications'
    });
  }
}
};

//unread notifications
export const getUnreadNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    const count = await Notification.countDocuments({
      userId,
      isRead: false
    });

    res.status(200).json({
      status: 'success',
      data: {
        unreadCount: count
      }
    });
    return;
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch unread notifications count'
    });
    next(error);
  }
};

export const markAllNotificationsAsRead =async (req: Request, res: Response, next: NextFunction): Promise<void> =>{
  try {
    const userId = req.user?.id;  

    if (!userId) {
       res.status(401).json({
        status: 'error',
        message: 'User not authenticated',
      });
      return;
    }

    const result = await Notification.updateMany(
      { userId, isRead: false },  
      { $set: { isRead: true } }  
    );

    if (result.modifiedCount === 0) {
       res.status(404).json({
        status: 'error',
        message: 'No unread notifications found to mark as read',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: `Marked ${result.modifiedCount} notifications as read.`,
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notifications as read',
    });
    return;
    next(error);
  }
};

export const updateNotificationStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { notificationStatus } = req.body; 
    if (!userId) {
       res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
      return;
    }

    if (typeof notificationStatus !== 'boolean') {
     res.status(400).json({
        status: 'error',
        message: 'notificationStatus should be a boolean value'
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { notificationStatus },
      { new: true }
    ).select('notificationStatus');

    if (!user) {
       res.status(404).json({
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

