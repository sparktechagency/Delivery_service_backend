import { Request, Response, NextFunction } from 'express';
import { UserActivity } from './user.activity.model';
import { AuthRequest } from '../../middlewares/auth';
import { User } from './user.model';
import { ParcelRequest, ParcelRequestDocument } from '../parcel/ParcelRequest.model';
import { DeliveryStatus, UserRole } from '../../../types/enums';
import { AppError } from '../../middlewares/error';
import mongoose from 'mongoose';
 // Import the updated DeliveryStatus enum


// export const getuAdminProfile = async (req: any, res: Response, next: NextFunction) => {
//     try {
//       const userId = req.params.userId;  // Get the userId from the URL
      
//       // Ensure that the request is made by an admin
//       if (req.user?.role !== UserRole.ADMIN) {
//         throw new AppError('Unauthorized', 403);  // Only admin can access this
//       }
  
//       // Fetch the user and populate SendOrders and RecciveOrders with parcel data and assigned deliverer details
//       const user = await User.findById(userId)
//         .populate({
//           path: 'SendOrders.parcelId',  // Populate the parcel data in SendOrders
//           select: 'pickupLocation deliveryLocation price title description senderType deliveryType deliveryStartTime deliveryEndTime deliveryStatus assignedDelivererId',
//           populate: {
//             path: 'assignedDelivererId',  // Populate the assignedDelivererId with user details
//             select: 'fullName email role'
//           }
//         })
//         .populate({
//           path: 'RecciveOrders.parcelId',  // Populate the parcel data in RecciveOrders
//           select: 'pickupLocation deliveryLocation price title description senderType deliveryType deliveryStartTime deliveryEndTime deliveryStatus senderId assignedDelivererId',
//           populate: [
//             {
//               path: 'senderId',  // Populate the senderId with user details
//               select: 'fullName email role'
//             },
//             {
//               path: 'assignedDelivererId',  // Populate the assignedDelivererId with user details
//               select: 'fullName email role'
//             }
//           ]
//         });
  
//       if (!user) {
//         throw new AppError("User not found", 404);
//       }
  
//       // Fetch the activity if the user is an admin
//       const userActivity = await UserActivity.findOne({ userId })
//         .sort({ activityDate: -1 });  // Sort to get the latest activity
  
//       if (userActivity) {
//         // Dynamically add the activity field to the user object
//         user.activity = {
//           loginTime: userActivity.loginTime,
//           logoutTime: userActivity.logoutTime,
//           timeSpent: userActivity.timeSpent,  // Time spent in minutes
//         };
//       } else {
//         user.activity = {
//           loginTime: 'N/A',
//           logoutTime: 'N/A',
//           timeSpent: 0,
//         };
//       }
  
//       // Send back the user profile data, including activity if the user is an admin
//       res.status(200).json({
//         status: "success",
//         message: "User profile fetched successfully",
//         data: user,
//       });
  
//     } catch (error) {
//       next(error);  // Use the next function to handle errors and pass them to the error-handling middleware
//     }
//   };

export const getUserProfileAndParcels = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Extract userId from request parameters
      const userId = req.params.userId;
      
      // Validate user ID
      if (!userId) {
        throw new AppError("User ID is required", 400);
      }
  
      // Log the incoming user ID for debugging
      console.log('Searching for User ID:', userId);
  
      // Find user with detailed profile information
      // Use mongoose.Types.ObjectId to ensure correct ID parsing
      const user = await User.findById(new mongoose.Types.ObjectId(userId))
        .select('-passwordHash') // Exclude sensitive information
        .lean();
  
      // Log found user for debugging
      console.log('Found User:', user);
  
      if (!user) {
        console.error('No user found with ID:', userId);
        throw new AppError("User not found", 404);
      }
  
      // Fetch parcels 
      const parcels = await ParcelRequest.find({
        $or: [
          { senderId: userId },
          { assignedDelivererId: userId },
          { deliveryRequests: userId }
        ],
        status: {
          $in: [
            DeliveryStatus.PENDING, 
            DeliveryStatus.WAITING, 
            // DeliveryStatus.ACCEPTED, 
            DeliveryStatus.IN_TRANSIT
          ]
        }
      })
        .populate("senderId", "fullName email mobileNumber role profileImage")
        .populate("assignedDelivererId", "fullName email mobileNumber role profileImage")
        .populate("deliveryRequests", "fullName email mobileNumber role profileImage")
        .sort({ createdAt: -1 }) // Sort by most recent first
        .limit(10) // Limit to 10 most recent parcels
        .lean();
  
      // Prepare user profile data
      const userProfile = {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        Image: user.image,
        role: user.role,
        freeDeliveries: user.freeDeliveries,
        totalOrders: user.totalOrders,
        totaltripsCompleted: user.TotaltripsCompleted,
        subscriptionType: user.subscriptionType,
        isVerified: user.isVerified,
        socialLinks: {
          facebook: user.facebook,
          instagram: user.instagram,
          whatsapp: user.whatsapp
        },
        stats: {
          totalSentParcels: user.totalSentParcels || 0,
          totalReceivedParcels: user.totalReceivedParcels || 0,
          avgRating: user.avgRating || 0
        }
      };
  
      res.status(200).json({
        status: "success",
        message: "User profile and parcels fetched successfully",
        profile: userProfile,
        parcels: parcels,
        parcelCount: parcels.length
      });
  
    } catch (error) {
      console.error('Detailed Error in getUserProfileAndParcels:', error);
      
      // More detailed error response
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: "error",
          message: error.message
        });
      } else {
        res.status(500).json({
          status: "error",
          message: "Internal server error",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };
  
  // Optional: Middleware to ensure user can only access their own profile or admin can access any profile
  export const validateProfileAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
    const requestedUserId = req.params.userId;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;
  
    // Allow access if:
    // 1. User is accessing their own profile
    // 2. User is an admin
    if (
      requestedUserId === currentUserId || 
      currentUserRole === UserRole.ADMIN
    ) {
      return next();
    }
  
    // Unauthorized access
    throw new AppError('Unauthorized to access this profile', 403);
  };
  
  
  
  
export const trackUserActivity = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next();
    }

    // Track login time if it is the user's first request
    const activity = await UserActivity.findOne({ userId, activityDate: new Date().toDateString() });

    if (!activity) {
      // Log user login time
      const newActivity = new UserActivity({
        userId,
        loginTime: new Date(),
      });
      await newActivity.save();
    } else {
      // Update the existing activity with logout time
      const logoutTime = new Date();
      const timeSpent = (logoutTime.getTime() - activity.loginTime.getTime()) / 1000 / 60;  // Time in minutes
      activity.logoutTime = logoutTime;
      activity.timeSpent = timeSpent;
      await activity.save();
    }

    next();
  } catch (error) {
    console.error('Error tracking user activity', error);
    next();
  }
};

export const getUserActivityReport = async (req: Request, res: Response) => {
    try {
      const activities = await UserActivity.aggregate([
        { $group: { 
            _id: "$userId", 
            totalTimeSpent: { $sum: "$timeSpent" },
            date: { $first: "$activityDate" },
          },
        },
        { $sort: { "date": -1 } },  
      ]);
  
      res.status(200).json({
        status: "success",
        message: "User activity report fetched successfully",
        data: activities,
      });
    } catch (error) {
      console.error("❌ Error fetching activity report", error);
      res.status(500).json({
        status: "error",
        message: "An error occurred while fetching user activity report",
      });
    }
  };