import { NextFunction, Response, Request } from "express";
import { AuthRequest } from "../../middlewares/auth";
import { AppError } from "../../middlewares/error";
import { User } from "./user.model";
import multer from 'multer';  // Import multer for handling file uploads
import fs from 'fs';
import path from 'path';
// import upload from "../../../multer/multer"; // Import your multer middleware
import { UserSubscription } from "../subscriptions/subscription.model";
import { error } from "console";
import fileUploadHandler from '../../../multer/multer'; 
import { IUser } from "../../../types/interfaces";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";


// export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
//   const userId = req.user?.id; 
//   const { name, email, facebook, instagram, whatsapp } = req.body; 
//   const image = req.file; 

//   if (!userId) throw new AppError("Unauthorized", 401);

//   try {
//     const user = await User.findById(userId);
//     if (!user) throw new AppError("User not found", 404);

//     user.fullName = name || user.fullName;
//     user.email = email || user.email;
//     user.facebook = facebook || user.facebook;
//     user.instagram = instagram || user.instagram;
//     user.whatsapp = whatsapp || user.whatsapp;

//     if (image) {
//       user.profileImage = `/uploads/profiles/${image.filename}`;
//     }

//     await user.save();
//     const updatedUser = await User.findById(userId).select('-passwordHash');

//     res.status(200).json({
//       status: "success",
//       message: "Profile updated successfully",
//       data: updatedUser,
//     });
//   } catch (error) {
//     console.error("❌ Error Updating Profile:", error);
//     next(error); 
//   }
// };





// export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       throw new AppError("Unauthorized", 401);
//     }

//     // Fetch the user and populate SendOrders and RecciveOrders with parcel data
//     const user = await User.findById(userId)
//       .populate({
//         path: 'SendOrders.parcelId',  // Populate the parcel data in SendOrders
//         select: 'pickupLocation deliveryLocation price title description senderType deliveryType  deliveryStartTime deliveryEndTime',
//       })
//       .populate({
//         path: 'RecciveOrders.parcelId', 
//         select: 'pickupLocation deliveryLocation price title description senderType deliveryType  deliveryStartTime deliveryEndTime',
//       });

//     if (!user) {
//       throw new AppError("User not found", 404);
//     }

//     res.status(200).json({
//       status: "success",
//       message: "User profile fetched successfully",
//       data: user,
//     });
//   } catch (error) {
//     next(error);
//   }
// };


const upload = fileUploadHandler();

export const updateProfile = async (req: Request, res: Response) => {
  upload(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const { fullName,facebook,instagram,whatsapp, mobileNumber } = req.body;
      const user = req.user; 

      const updatedUserData: any = {};

      if (fullName) {
        updatedUserData.fullName = fullName;
      }

      if (facebook) {
        updatedUserData.facebook = facebook;
      }
      if (instagram) {
        updatedUserData.instagram = instagram;
      }

      if (whatsapp) {
        updatedUserData.whatsapp = whatsapp;
      }
      if (mobileNumber) {
        updatedUserData.mobileNumber = mobileNumber;
      }

      if (req.files && (req.files as { [fieldname: string]: Express.Multer.File[] })['image']) {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const imagePath = '/uploads/image/' + files['image'][0].filename;  
        updatedUserData.image = imagePath;
      }

      const updatedUser = await User.findOneAndUpdate(
        { _id: user?.id },
        { $set: updatedUserData },
        { new: true }
      );


      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      const userProfile = {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        facebook: updatedUser.facebook,
        instagram: updatedUser.instagram,
        whatsapp: updatedUser.whatsapp,
        mobileNumber: updatedUser.mobileNumber,
        Image: updatedUser.image || 'https://i.ibb.co/z5YHLV9/profile.png', 
  
      };

      res.status(200).json({ message: 'Profile updated successfully', user: userProfile });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Error updating profile', error });
    }
  });
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }
    const user = await User.findById(userId)
      .populate({
        path: 'SendOrders.parcelId',
        select: 'pickupLocation deliveryLocation price title description senderType deliveryType deliveryStartTime deliveryEndTime',
      })
      .populate({
        path: 'RecciveOrders.parcelId',
        select: 'pickupLocation deliveryLocation price title description senderType deliveryType deliveryStartTime deliveryEndTime',
      });
 
    if (!user) {
      throw new AppError("User not found", 404);
    }
    
    const earningsData = {

      totalEarnings: user.totalEarning || 0,
      monthlyEarnings: user.monthlyEarnings || 0,
      totalAmountSpent: user.totalAmountSpent || 0,
      totalSentParcels: user.totalSentParcels || 0,
      totalReceivedParcels: user.totalReceivedParcels || 0,
      tripsCompleted: user.TotaltripsCompleted || 0
    };

    const totalRatings = user.reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = user.reviews.length > 0 ? totalRatings / user.reviews.length : 0;
    
    res.status(200).json({
      status: "success",
      message: "User profile fetched successfully",
      data: {

        user: {
          ...user.toObject(),
          mobileNumber: user.mobileNumber || "", 
          facebook: user.facebook || "", 
          instagram: user.instagram || "",
          whatsapp: user.whatsapp || "",
          email : user.email || "missing email",
          image: user.image || "https://i.ibb.co/z5YHLV9/profile.png",
          fcmToken: user.fcmToken || "",
          country: user.country || "",

        },
        earnings: earningsData,
        averageRating: averageRating.toFixed(2),
        totalReviews: user.reviews.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

//single profile data
export const getSingleProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Convert mongoose document to plain object
    const userObj = user.toObject();

    // Remove the fields you don't want to expose
if (userObj.RecciveOrders !== undefined) {
  delete userObj.RecciveOrders;
}
if (userObj.SendOrders !== undefined) {
  delete userObj.SendOrders;
}


    const earningsData = {
      totalEarnings: user.totalEarning || 0,
      monthlyEarnings: user.monthlyEarnings || 0,
      totalAmountSpent: user.totalAmountSpent || 0,
      totalSentParcels: user.totalSentParcels || 0,
      totalReceivedParcels: user.totalReceivedParcels || 0,
      tripsCompleted: user.TotaltripsCompleted || 0,
    };

    const totalRatings = user.reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = user.reviews.length > 0 ? totalRatings / user.reviews.length : 0;

    res.status(200).json({
      status: "success",
      message: "User profile fetched successfully",
      data: {
        user: {
          ...userObj,
          mobileNumber: user.mobileNumber || "",
          facebook: user.facebook || "",
          instagram: user.instagram || "",
          whatsapp: user.whatsapp || "",
          email: user.email || "missing email",
          image: user.image || "https://i.ibb.co/z5YHLV9/profile.png",
          fcmToken: user.fcmToken || "",
          country: user.country || "",
        },
        earnings: earningsData,
        averageRating: averageRating.toFixed(2),
        totalReviews: user.reviews.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// delete user
export const deleteProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    res.status(200).json({
      status: "success",
      message: "User deleted successfully", 
    })
      next(error);
  } catch (error) {
    next(error);
  } 
};

export const getRemainingSubscriptionTrialDays =async (req: Request, res: Response, next: NextFunction): Promise<void> =>{
  try {
    const { userId } = req.params;

    // Fetch user subscription details
    const userSubscription = await UserSubscription.findOne({ userId });

    if (!userSubscription) {
       res.status(404).json({ message: "User subscription not found" });
       return;
    }

    // Check if the user is in the trial period
    if (!userSubscription.isTrial) {
       res.status(400).json({ message: "User is not in a trial period" });
    }

    // Calculate remaining trial days
    const currentDate = new Date();
    const expiryDate = userSubscription.expiryDate;

    // If the trial period has expired
    if (currentDate >= expiryDate) {
       res.status(200).json({
        message: "Trial period has ended",
        trialPeriod: userSubscription.expiryDate ? userSubscription.expiryDate : 0,
        remainingDays: 0
      });
    }

    // Calculate the remaining days in the trial
    const remainingTime = expiryDate.getTime() - currentDate.getTime();
    const remainingDays = Math.ceil(remainingTime / (1000 * 3600 * 24)); 

    res.status(200).json({
      message: "Trial period remaining",
      trialPeriod: userSubscription.expiryDate ? userSubscription.expiryDate : 0,
      remainingDays: remainingDays
    });
  } catch (error) {
    console.error("Error calculating remaining trial days:", error);
    res.status(500).json({ message: "Error calculating remaining trial days", error });
  }
};

