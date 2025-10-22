import { Request, Response, NextFunction } from 'express';
import { UserActivity } from './user.activity.model';
import { AuthRequest } from '../../middlewares/auth';
import { User } from './user.model';
import { ParcelRequest, ParcelRequestDocument } from '../parcel/ParcelRequest.model';
import { DeliveryStatus, UserRole } from '../../../types/enums';
import { AppError } from '../../middlewares/error';
import mongoose from 'mongoose';


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
  export const getUserProfileAndParcels = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    console.log('Searching for User ID:', userId);

    // Fetch the user details by userId
    const user = await User.findById(new mongoose.Types.ObjectId(userId))
      .select('-passwordHash') // Exclude passwordHash from the response
      .lean();

    console.log('Found User:', user);

    if (!user) {
      console.error('No user found with ID:', userId);
      throw new AppError("User not found", 404);
    }

    if (user.reviews && user.reviews.length > 0) {
      const totalRating = user.reviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = totalRating / user.reviews.length;
      user.avgRating = parseFloat(avgRating.toFixed(2)); // Round to 2 decimal places
    } else {
      user.avgRating = 0; // If no reviews, set avgRating to 0
    }

    // Fetch the parcels associated with the user
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
      image: user.image,
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
        avgRating: user.avgRating || 0  // Include the avgRating here
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
