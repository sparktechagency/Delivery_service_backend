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


//   export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const page = parseInt(req.query.page as string) || 1; // Page number from query parameter
//       const limit = parseInt(req.query.limit as string) || 10; // Number of users per page
  
//       const skip = (page - 1) * limit; // Calculate skip for pagination
  
//       console.log("🔍 Fetching users with pagination...");
      
//       // Query to fetch users with pagination and select only relevant fields
//       const users = await User.find()
//         .skip(skip)
//         .limit(limit)
//         .select('fullName email role isVerified freeDeliveries tripsPerDay isSubscribed subscriptionType subscriptionPrice subscriptionStartDate subscriptionExpiryDate subscriptionCount TotaltripsCompleted  createdAt') // Select only necessary fields
//         .exec();
      
//       console.log("📌 Query Result:", users);  
//       /*
//  isSubscribed?: boolean;
//   subscriptionType: SubscriptionType; // Added subscription type
//   subscriptionPrice: number; // Added subscription price
//   subscriptionStartDate: Date; // Added subscription start date
//   subscriptionExpiryDate: Date; // Added subscription expiry date
//   subscriptionCount: number;
//       */
  
//       if (users.length === 0) {
//         console.log("❌ No users found in database!");
//         return res.status(404).json({ status: "error", message: "No users found" });
//       }
  
//       // Get the total count of users for pagination purposes
//       const totalUsers = await User.countDocuments();
  
//       res.json({
//         status: 'success',
//         data: {
//           users,
//           totalUsers,
//           currentPage: page,
//           totalPages: Math.ceil(totalUsers / limit)
//         }
//       });
//     } catch (error) {
//       console.error("❌ Error fetching users:", error);
//       res.status(500).json({ status: "error", message: "Internal Server Error" });
//     }
//   };

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1; // Page number from query parameter
    const limit = parseInt(req.query.limit as string) || 10; // Number of users per page

    const skip = (page - 1) * limit; // Calculate skip for pagination

    console.log("🔍 Fetching users with pagination...");
    
    // Query to fetch users with pagination and select only relevant fields
    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .select('fullName email role isVerified freeDeliveries tripsPerDay isSubscribed subscriptionType subscriptionPrice subscriptionStartDate subscriptionExpiryDate subscriptionCount TotaltripsCompleted createdAt') // Select only necessary fields
      .exec();
    
    console.log("📌 Query Result:", users);  

    if (users.length === 0) {
      console.log("❌ No users found in database!");
      return res.status(404).json({ status: "error", message: "No users found" });
    }

    // Get the total count of users for pagination purposes
    const totalUsers = await User.countDocuments();

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