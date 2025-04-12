import { NextFunction, Response, Request } from "express";
import { AuthRequest } from "../../middlewares/auth";
import { AppError } from "../../middlewares/error";
import { User } from "./user.model";
import multer from 'multer';  // Import multer for handling file uploads
import fs from 'fs';
import path from 'path';
import upload from "../../../multer/multer"; // Import your multer middleware
import { UserSubscription } from "../subscriptions/subscription.model";



export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  // Use multer to handle the image upload
  upload.single('profileImage')(req, res, async (err: any) =>  {
    try {
      // If there's an error during the file upload
      if (err) {
        console.error("❌ Multer Error:", err);  // Log the error
        throw new AppError("Error uploading file", 400);
      }

      const userId = req.user?.id; // Get logged-in user ID
      const { name, email, facebook, instagram, whatsapp } = req.body; // Extract form data fields

      const image = req.file; // The uploaded file (image)

      if (!userId) throw new AppError("Unauthorized", 401); // Check if user is logged in

      // Find the user by ID
      const user = await User.findById(userId);
      if (!user) throw new AppError("User not found", 404);

      // Update the user's fields with the provided data
      user.fullName = name || user.fullName;
      user.email = email || user.email;
      user.facebook = facebook || user.facebook;
      user.instagram = instagram || user.instagram;
      user.whatsapp = whatsapp || user.whatsapp;

      // Handle profile image upload if a new image is provided
      if (image) {
        // Save the file path in the user's profileImage field directly from multer
        user.profileImage = `/uploads/profiles/${image.filename}`;
        console.log("✅ Profile Image Saved:", user.profileImage);
      }

      // Save the updated user profile
      await user.save();

      // Fetch and return the updated user profile, excluding password
      const updatedUser = await User.findById(userId).select('-passwordHash');

      res.status(200).json({
        status: "success",
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error("❌ Error Updating Profile:", error);
      next(error); // Pass error to the error-handling middleware
    }
  });
};

//   export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//         const userId = req.user?.id; // Logged-in user ID

//         // Fetch user details
//         const user = await User.findById(userId).select("-password"); // Exclude password for security
//         if (!user) throw new AppError("User not found", 404);

//         res.status(200).json({ 
//             status: "success", 
//             message: "User profile fetched successfully", 
//             data: user 
//         });
//     } catch (error) {
//         next(error);
//     }
// };

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    // Fetch the user and populate SendOrders and RecciveOrders with parcel data
    const user = await User.findById(userId)
      .populate({
        path: 'SendOrders.parcelId',  // Populate the parcel data in SendOrders
        select: 'pickupLocation deliveryLocation price title description senderType deliveryType deliveryStartTime deliveryEndTime',
      })
      .populate({
        path: 'RecciveOrders.parcelId',  // Populate the parcel data in RecciveOrders
        select: 'pickupLocation deliveryLocation price title description senderType deliveryType deliveryStartTime deliveryEndTime',
      });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.status(200).json({
      status: "success",
      message: "User profile fetched successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getRemainingSubscriptionTrialDays = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Fetch user subscription details
    const userSubscription = await UserSubscription.findOne({ userId });

    if (!userSubscription) {
      return res.status(404).json({ message: "User subscription not found" });
    }

    // Check if the user is in the trial period
    if (!userSubscription.isTrial) {
      return res.status(400).json({ message: "User is not in a trial period" });
    }

    // Calculate remaining trial days
    const currentDate = new Date();
    const expiryDate = userSubscription.expiryDate;

    // If the trial period has expired
    if (currentDate >= expiryDate) {
      return res.status(200).json({
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

