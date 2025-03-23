// admin.controller.ts
import { Request, Response, NextFunction } from 'express';

interface AdminRequest extends Request {
  admin?: {
    id: string;
  };
}
import bcrypt from 'bcryptjs';
import { Admin } from './admin.model';
import { AppError } from '../../middlewares/error';
import { Order } from '../parcel/order.model';
import { Report } from './report.model';
import { Subscription } from '../../models/subscription.model';
import { User } from '../user/user.model';
import { UserRole } from '../../../types/enums';
import { config } from 'process';
import jwt from 'jsonwebtoken';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { AuthRequest } from '../../middlewares/auth';
import upload from '../../../multer/multer';
import { ParcelRequest } from '../parcel/ParcelRequest.model';
// import upload from '../../../multer/multer';

export const createAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fullName, email, password, dob, permanentAddress, postalCode, username } = req.body;

    // Ensure all required fields are provided
    if (!email || !password || !username) {
      throw new AppError('Email, password, and username are required', 400);
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      throw new AppError('Admin with this email already exists', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      fullName,
      email,
      passwordHash,
      dob,
      permanentAddress,
      postalCode,
      username,
      role: UserRole.ADMIN,  // Always set role as ADMIN for new admin
      isActive: true
    });

    res.status(201).json({
      status: 'success',
      message: 'Admin created successfully',
      data: admin
    });
  } catch (error) {
    next(error);
  }
};


  export const loginAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
  
      // Ensure email and password are provided
      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }
  
      const admin = await Admin.findOne({ email });
      if (!admin) {
        throw new AppError('Invalid credentials', 401);
      }
  
      const isMatch = await bcrypt.compare(password, admin.passwordHash);
      if (!isMatch) {
        throw new AppError('Invalid credentials', 401);
      }
  
      // Generate JWT token
      const token = jwt.sign(
        { id: admin._id, role: admin.role },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );
  
      res.json({
        status: 'success',
        message: 'Admin logged in successfully',
        data: { token, admin }
      });
    } catch (error) {
      next(error);
    }
  };

  export const changeAdminPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const adminId = req.user?.id;
  
      if (!adminId) throw new AppError('Unauthorized', 401);
  
      const admin = await Admin.findById(adminId);
      if (!admin) throw new AppError('Admin not found', 404);
  
      // Check if current password is correct
      const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
      if (!isMatch) throw new AppError('Incorrect current password', 400);
  
      // Check if new passwords match
      if (newPassword !== confirmPassword) throw new AppError('New passwords do not match', 400);
  
      // Hash and update password
      admin.passwordHash = await bcrypt.hash(newPassword, 10);
      await admin.save();
  
      res.json({ status: 'success', message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  };
  

export const updateAdminProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Debugging the incoming request data
    console.log("📄 Received Body:", req.body);
    console.log("📂 Received File:", req.file);

    const adminId = req.params.id;
    const { name, email, dob, permanentAddress, postalCode, username } = req.body;
    const image = req.file; // Uploaded file will be available here

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized"
      });
    }

    // Find the user (must be an admin)
    const user = await Admin.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to update admin profiles"
      });
    }

    // Find the admin to update
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        status: "error",
        message: "Admin not found"
      });
    }

    // Update admin profile fields
    admin.fullName = name || admin.fullName;
    admin.email = email || admin.email;
    admin.dob = dob ? new Date(dob) : admin.dob;
    admin.permanentAddress = permanentAddress || admin.permanentAddress;
    admin.postalCode = postalCode || admin.postalCode;
    admin.username = username || admin.username;

    // Handle profile image upload
    if (image) {
      const uploadPath = `uploads/profiles/${Date.now()}-${image.originalname}`;
      fs.writeFileSync(uploadPath, image.buffer);
      admin.profileImage = `/${uploadPath}`; // Save file path
      console.log("✅ Profile Image Saved:", admin.profileImage);
    }

    // Save the updated admin profile
    await admin.save();

    // Return the updated admin profile excluding password hash
    const updatedAdmin = await Admin.findById(adminId).select('-passwordHash');
    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: updatedAdmin
    });
  } catch (error) {
    console.error("❌ Error Updating Profile:", error);
    next(error);
  }
};



export const getAdminProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError('Authorization token is required', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }

    const admin = await Admin.findById(decoded.id).select('-passwordHash');

    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    res.json({ status: 'success', data: admin });
  } catch (error) {
    next(error);
  }
};


export const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
      console.log("🔵 Received request body:", req.body);

      const { userId, isRestricted } = req.body;

      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
          console.error("❌ MongoDB is not connected");
          return res.status(500).json({ status: "error", message: "Database connection error" });
      }

      // Validate userId format
      if (!mongoose.Types.ObjectId.isValid(userId)) {
          console.error("❌ Invalid User ID:", userId);
          return res.status(400).json({ status: "error", message: "Invalid user ID" });
      }

      console.log("🔍 Searching for user with ID:", userId);
      const user = await User.findById(userId);

      if (!user) {
          console.log("❌ User not found in database:", userId);
          return res.status(404).json({ status: "error", message: "User not found" });
      }

      console.log("✅ User found:", user);
      user.isRestricted = isRestricted;
      await user.save();

      console.log("✅ User status updated successfully");
      res.json({ status: "success", message: isRestricted ? "User is restricted" : "User is active" });
  } catch (error) {
      console.error("❌ Error Updating User Status:", error);
      res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};
  
  export const reviewAdminUpdates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, feedback } = req.body;
      const user = await User.findById(userId);
      if (!user) throw new AppError('User not found', 404);
  
      user.adminFeedback = feedback;
      await user.save();
  
      res.json({ status: 'success', message: 'Feedback submitted successfully' });
    } catch (error) {
      next(error);
    }
  };


  

  export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        console.error("❌ MongoDB not connected");
        return res.status(500).json({ status: "error", message: "Database connection error" });
      }
  
      const { orderId, status } = req.query;
      const filter: any = {};
  
      // Validate and set orderId filter
      if (orderId) {
        if (!mongoose.Types.ObjectId.isValid(orderId as string)) {
          return res.status(400).json({ status: "error", message: "Invalid order ID" });
        }
        filter.orderId = orderId; // Use orderId instead of _id
      }
  
      // Validate and set status filter
      if (status) filter.status = status;
  
      console.log("🔵 Order Query Filters:", filter);
  
      // Fetch orders
      const orders = await Order.find(filter).populate("deliveryPerson");
  
      res.json({ status: "success", data: orders });
    } catch (error) {
      console.error("❌ Error Fetching Orders:", error);
      res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
  };



// export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const page = parseInt(req.query.page as string) || 1;
//     const limit = 10;
//     const skip = (page - 1) * limit;
//     const { filterType, filterValue } = req.query;

//     console.log("🔍 Fetching users with pagination, total trips completed, and total earnings...");
    
//     // Build filter criteria
//     let filter: any = {};
//     if (filterType === "mobile") filter.email = filterValue;
//     if (filterType === "email") filter.mobileNumber = filterValue;

//     // Fetch users with pagination and filter
//     const users = await User.find(filter)
//       .skip(skip)
//       .limit(limit)
//       .select('fullName email mobileNumber role isVerified freeDeliveries tripsPerDay isSubscribed isRestricted subscriptionType subscriptionPrice subscriptionStartDate subscriptionExpiryDate subscriptionCount TotaltripsCompleted totalEarning createdAt')
//       .lean();
    
//     if (users.length === 0) {
//       console.log("❌ No users found in database!");
//       return res.status(404).json({ status: "error", message: "No users found" });
//     }

//     // Fetch total earnings and trips completed in one aggregation query for all users
//     const earningsData = await ParcelRequest.aggregate([
//       { $match: { status: "DELIVERED", assignedDelivererId: { $in: users.map(user => user._id) } } },
//       { $group: { _id: "$assignedDelivererId", totalTrips: { $sum: 1 }, totalEarnings: { $sum: "$price" } } }
//     ]);

//     // Map earnings data to users
//     for (let user of users) {
//       const earnings = earningsData.find(data => data._id.toString() === user._id.toString());
//       user.TotaltripsCompleted = earnings ? earnings.totalTrips : 0;
//       user.totalEarning = earnings ? earnings.totalEarnings : 0;
//     }

//     // Get the total count of users for pagination purposes
//     const totalUsers = await User.countDocuments(filter);

//     res.json({
//       status: 'success',
//       data: {
//         users,
//         totalUsers,
//         currentPage: page,
//         totalPages: Math.ceil(totalUsers / limit)
//       }
//     });
//   } catch (error) {
//     console.error("❌ Error fetching users:", error);
//     res.status(500).json({ status: "error", message: "Internal Server Error" });
//   }
// };
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const { filterType, filterValue, sortBy, sortOrder } = req.query;

    console.log("🔍 Fetching users with pagination, rating, earnings, and sorting...");

    // Build filter criteria
    let filter: any = {};
    
    // Filter by rating or earning
    if (filterType === "rating") {
      const ratingValue = filterValue ? parseInt(filterValue as string) : 0;  // Default to 0 if not provided
      if (ratingValue === 0) {
        filter["reviews.rating"] = { $exists: true };  // Include users with any rating, including 0
      } else {
        filter["reviews.rating"] = ratingValue;  // Filter for the exact rating
      }
    }

    if (filterType === "earning") {
      const earningValue = filterValue ? parseInt(filterValue as string) : 0;  // Default to 0 if not provided
      if (earningValue === 0) {
        filter["totalEarning"] = 0;  // Filter for users with 0 earnings
      } else {
        filter["totalEarning"] = earningValue;  // Filter for the exact earning value
      }
    }

    // Handle sorting logic
    let sortCriteria: any = {};
    if (sortBy === "rating") {
      sortCriteria["reviews.rating"] = sortOrder === "desc" ? -1 : 1;  // Sort by rating (desc/asc)
    } else if (sortBy === "earning") {
      sortCriteria["totalEarning"] = sortOrder === "desc" ? -1 : 1;  // Sort by totalEarning (desc/asc)
    }

    console.log('Filter Criteria:', filter);
    console.log('Sort Criteria:', sortCriteria);

    // Fetch users with pagination, filter, and sorting
    const users = await User.find(filter)
    .skip(skip)
    .limit(limit)
    .select('fullName email mobileNumber role isVerified freeDeliveries tripsPerDay isSubscribed isRestricted subscriptionType subscriptionPrice subscriptionStartDate subscriptionExpiryDate subscriptionCount TotaltripsCompleted totalEarning createdAt reviews')
    .lean();
  
  users.forEach((user) => {
    // Calculate the average rating for each user
    if (user.reviews && user.reviews.length > 0) {
      const totalRating = user.reviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = totalRating / user.reviews.length;
      // Ensure avgRating is a number (parseFloat or Number)
      user.avgRating = parseFloat(avgRating.toFixed(2));  // Convert to a number with two decimals
    } else {
      user.avgRating = 0;  // No rating available
    }
  });
  

    // Get the total count of users for pagination purposes
    const totalUsers = await User.countDocuments(filter);

    res.json({
      status: 'success',
      data: {
        users,
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

  export const getUserData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;  // Get logged-in user ID from `req.user`
  
      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "Unauthorized"
        });
      }
  
      // Find the user by ID
      const user = await User.findById(userId).select('-passwordHash'); // Exclude the password field
  
      if (!user) {
        throw new AppError('User not found', 404);
      }
  
      res.status(200).json({
        status: "success",
        data: user,
      });
    } catch (error) {
      console.error("❌ Error Fetching User Data:", error);
      next(error); // Pass error to the global error handler
    }
  };
  

export const holdUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    user.isRestricted = !user.isRestricted;
    await user.save();
    res.json({ status: 'success', message: user.isRestricted ? 'User is restricted' : 'User is active' });
  } catch (error) {
    next(error);
  }
};


export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await Report.find().populate('user');
    res.json({ status: 'success', data: reports });
  } catch (error) {
    next(error);
  }
};


export const manageSubscriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, subscriptionType } = req.body;
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    let subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      subscription = await Subscription.create({ userId, type: subscriptionType, freeParcels: 3 });
    } else {
      subscription.type = subscriptionType;
      await subscription.save();
    }

    res.json({ status: 'success', message: 'Subscription updated successfully', data: subscription });
  } catch (error) {
    next(error);
  }
};

// export const getParcelDetails = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     // Fetch all parcel details with sender and receiver populated
//     const parcels = await ParcelRequest.find()
//       .populate('senderId', 'fullName email role')  // Populate sender details
//       .populate('assignedDelivererId', 'fullName email role')  // Populate deliverer details
//       .select('pickupLocation deliveryLocation status deliveryType price senderId assignedDelivererId')  // Select necessary fields

//     // If no parcels are found
//     if (parcels.length === 0) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'No parcels found'
//       });
//     }

//     // Return the parcel details along with sender and deliverer information
//     res.status(200).json({
//       status: 'success',
//       message: 'Parcel details fetched successfully',
//       data: parcels
//     });
//   } catch (error) {
//     next(error);  // Pass error to global error handler
//   }
// };

export const getParcelDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Build the filter object
    let filter: any = {};
    if (status) {
      filter.status = status.toString();
    }

    // Fetch filtered parcels with pagination
    const parcels = await ParcelRequest.find(filter)
      .populate('senderId', 'fullName email role') // Populate sender details
      .populate('assignedDelivererId', 'fullName email role') // Populate deliverer details
      .select('pickupLocation deliveryLocation status deliveryType price senderId assignedDelivererId') // Select necessary fields
      .skip(skip)
      .limit(limitNumber)
      .lean();

    // Count total parcels for pagination metadata
    const totalParcels = await ParcelRequest.countDocuments(filter);
    const totalPages = Math.ceil(totalParcels / limitNumber);

    // If no parcels are found
    if (parcels.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No parcels found'
      });
    }

    // Return paginated parcel details
    res.status(200).json({
      status: 'success',
      message: 'Parcel details fetched successfully',
      data: parcels,
      pagination: {
        totalParcels,
        totalPages,
        currentPage: pageNumber,
        limit: limitNumber
      }
    });
  } catch (error) {
    next(error); // Pass error to global error handler
  }
};


// export const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const { userId, isRestricted } = req.body;
//       const user = await User.findById(userId);
//       if (!user) throw new AppError('User not found', 404);
  
//       user.isRestricted = isRestricted;
//       await user.save();
  
//       res.json({ status: 'success', message: isRestricted ? 'User is restricted' : 'User is active' });
//     } catch (error) {
//       next(error);
//     }
//   };
  
//   export const reviewAdminUpdates = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const { userId, feedback } = req.body;
//       const user = await User.findById(userId);
//       if (!user) throw new AppError('User not found', 404);
  
//       user.adminFeedback = feedback;
//       await user.save();
  
//       res.json({ status: 'success', message: 'Feedback submitted successfully' });
//     } catch (error) {
//       next(error);
//     }
//   };