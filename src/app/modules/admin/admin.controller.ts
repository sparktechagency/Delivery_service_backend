// admin.controller.ts
import { Request, Response, NextFunction } from 'express';
import { DeliveryType } from '../../../types/enums';
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
import { DeliveryStatus, UserRole } from '../../../types/enums';
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
//     const { filterType, sortBy, sortOrder } = req.query;

//     console.log("🔍 Fetching users with pagination, rating, earnings, and sorting...");

//     // Build filter criteria
//     let filter: any = {};

//     // Filter by highest or lowest rating
//     if (filterType === "rating") {
//       // If filterType is 'rating', we will just sort by highest or lowest rating
//       // No need to check for specific rating values, just use the default behavior (highest or lowest)
//     }

//     // Filter by highest or lowest earnings
//     if (filterType === "earning") {
//       // Same logic as for rating, just filter by highest or lowest earning
//     }

//     // Handle sorting logic
//     let sortCriteria: any = {};
//     if (sortBy === "rating") {
//       sortCriteria["avgRating"] = sortOrder === "desc" ? -1 : 1;  // Sort by avgRating (desc/asc)
//     } else if (sortBy === "earning") {
//       sortCriteria["totalEarning"] = sortOrder === "desc" ? -1 : 1;  // Sort by totalEarning (desc/asc)
//     } else {
//       // Default sorting by highest rating if no sortBy is provided
//       sortCriteria["avgRating"] = -1;  // Default sorting by highest rating
//     }

//     console.log('Filter Criteria:', filter);
//     console.log('Sort Criteria:', sortCriteria);

//     // Fetch users with pagination, filter, and sorting
//     const users = await User.find(filter)
//       .skip(skip)
//       .limit(limit)
//       .select('fullName email mobileNumber role isVerified freeDeliveries tripsPerDay isSubscribed isRestricted subscriptionType subscriptionPrice subscriptionStartDate subscriptionExpiryDate subscriptionCount TotaltripsCompleted totalEarning createdAt reviews')
//       .lean();

//     // Calculate the average rating for each user
//     users.forEach((user) => {
//       if (user.reviews && user.reviews.length > 0) {
//         const totalRating = user.reviews.reduce((sum, review) => sum + review.rating, 0);
//         const avgRating = totalRating / user.reviews.length;
//         user.avgRating = parseFloat(avgRating.toFixed(2));  // Convert to a number with two decimals
//       } else {
//         user.avgRating = 0;  // No rating available
//       }
//     });

//     // Sort users based on the specified sort criteria
//     const sortedUsers = users.sort((a: any, b: any) => {
//       if (sortBy === 'rating') {
//         return sortOrder === 'desc' ? b.avgRating - a.avgRating : a.avgRating - b.avgRating;
//       } else if (sortBy === 'earning') {
//         return sortOrder === 'desc' ? b.totalEarning - a.totalEarning : a.totalEarning - b.totalEarning;
//       }
//       return 0;  // Default: no sorting if sortBy is not specified
//     });

//     // Get the total count of users for pagination purposes
//     const totalUsers = await User.countDocuments(filter);
//     const totalPages = Math.ceil(totalUsers / limit);

//     // Respond with the data and pagination info
//     res.json({
//       status: 'success',
//       data: {
//         users: sortedUsers,
//         totalUsers,
//         currentPage: page,
//         totalPages
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
    const { filterType, sortBy, sortOrder } = req.query;

    console.log("🔍 Fetching users with pagination, rating, earnings, and sorting...");

    // Build filter criteria
    let filter: any = {};

    // Filter by highest or lowest rating
    if (filterType === "rating") {
      // If filterType is 'rating', we will just sort by highest or lowest rating
      // No need to check for specific rating values, just use the default behavior (highest or lowest)
    }

    // Filter by highest or lowest earnings
    if (filterType === "earning") {
      // Same logic as for rating, just filter by highest or lowest earning
    }

    // Handle sorting logic
    let sortCriteria: any = {};
    if (sortBy === "rating") {
      sortCriteria["avgRating"] = sortOrder === "desc" ? -1 : 1;  // Sort by avgRating (desc/asc)
    } else if (sortBy === "earning") {
      sortCriteria["totalEarning"] = sortOrder === "desc" ? -1 : 1;  // Sort by totalEarning (desc/asc)
    } else {
      // Default sorting by highest rating if no sortBy is provided
      sortCriteria["avgRating"] = -1;  // Default sorting by highest rating
    }

    console.log('Filter Criteria:', filter);
    console.log('Sort Criteria:', sortCriteria);

    // Fetch users with pagination, filter, and sorting
    const users = await User.find(filter)
      .skip(skip)
      .limit(limit)
      .select('fullName email mobileNumber role isVerified freeDeliveries tripsPerDay isSubscribed isRestricted subscriptionType subscriptionPrice subscriptionStartDate subscriptionExpiryDate subscriptionCount TotaltripsCompleted totalEarning createdAt reviews')
      .lean();

    // Calculate the average rating for each user
    users.forEach((user) => {
      if (user.reviews && user.reviews.length > 0) {
        const totalRating = user.reviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = totalRating / user.reviews.length;
        user.avgRating = parseFloat(avgRating.toFixed(2));  // Convert to a number with two decimals
      } else {
        user.avgRating = 0;  // No rating available
      }
    });

    // Sort users based on the specified sort criteria
    const sortedUsers = users.sort((a: any, b: any) => {
      if (sortBy === 'rating') {
        return sortOrder === 'desc' ? b.avgRating - a.avgRating : a.avgRating - b.avgRating;
      } else if (sortBy === 'earning') {
        return sortOrder === 'desc' ? b.totalEarning - a.totalEarning : a.totalEarning - b.totalEarning;
      }
      return 0;  // Default: no sorting if sortBy is not specified
    });

    // Get the total count of users for pagination purposes
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    // Respond with the data and pagination info
    res.json({
      status: 'success',
      data: {
        users: sortedUsers,
        totalUsers,
        currentPage: page,
        totalPages
      }
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};


export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userIdToDelete = req.params.userId; // Assuming the userId is passed as a URL parameter

    // Check if the user to be deleted exists in the database
    const userToDelete = await User.findById(userIdToDelete);
    if (!userToDelete) {
      throw new AppError('User not found', 404);
    }

    // Proceed with deleting the user
    await User.findByIdAndDelete(userIdToDelete);

    return res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
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
//     const { status, page = 1, limit = 10 } = req.query;

//     // Convert page and limit to numbers
//     const pageNumber = parseInt(page as string, 10) || 1;
//     const limitNumber = parseInt(limit as string, 10) || 10;
//     const skip = (pageNumber - 1) * limitNumber;

//     // Build the filter object
//     let filter: any = {};
//     if (status) {
//       filter.status = status.toString();
//     }

//     // Fetch filtered parcels with pagination
//     const parcels = await ParcelRequest.find(filter)
//       .populate('senderId', 'fullName email role') // Populate sender details
//       .populate('assignedDelivererId', 'fullName email role') // Populate deliverer details
//       .select('pickupLocation deliveryLocation status deliveryType price senderId assignedDelivererId') // Select necessary fields
//       .skip(skip)
//       .limit(limitNumber)
//       .lean();

//     // Count total parcels for pagination metadata
//     const totalParcels = await ParcelRequest.countDocuments(filter);
//     const totalPages = Math.ceil(totalParcels / limitNumber);

//     // If no parcels are found
//     if (parcels.length === 0) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'No parcels found'
//       });
//     }

//     // Return paginated parcel details
//     res.status(200).json({
//       status: 'success',
//       message: 'Parcel details fetched successfully',
//       data: parcels,
//       pagination: {
//         totalParcels,
//         totalPages,
//         currentPage: pageNumber,
//         limit: limitNumber
//       }
//     });
//   } catch (error) {
//     next(error); // Pass error to global error handler
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

    // Fetch filtered parcels with pagination and populate all the required details
    const parcels = await ParcelRequest.find(filter)
      .populate('senderId', 'fullName email role profileImage mobileNumber') // Populate sender details including image
      .populate('receiverId', 'fullName email role profileImage mobileNumber') // Populate receiver details including image
      .populate('deliveryRequests', 'fullName email role profileImage mobileNumber') // Populate delivery requests details with image
      .populate('assignedDelivererId', 'fullName email role profileImage mobileNumber') // Populate deliverer details with image
      .select('pickupLocation deliveryLocation status deliveryType price senderId receiverId assignedDelivererId deliveryRequests images') // Select necessary fields
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
import moment from 'moment';  // We can use moment.js for easier date manipulation

interface DeliveryTimes {
  [DeliveryType.TRUCK]: { totalTime: number, count: number };
  [DeliveryType.CAR]: { totalTime: number, count: number };
  [DeliveryType.BICYCLE]: { totalTime: number, count: number };
  [DeliveryType.BIKE]: { totalTime: number, count: number };
  [DeliveryType.PERSON]: { totalTime: number, count: number };
  [DeliveryType.Taxi]: { totalTime: number, count: number };
  [DeliveryType.AirPlane]: { totalTime: number, count: number };
}

export const getOrderDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = 1, limit = 10, day, month, year } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Build the filter object based on status
    let filter: any = {};

    // Date filters based on day, month, and year
    if (year || month || day) {
      let startDate = moment();
      let endDate = moment();

      if (year) {
        startDate = startDate.year(parseInt(year as string, 10)).startOf('year');
        endDate = endDate.year(parseInt(year as string, 10)).endOf('year');
      }
      if (month) {
        startDate = startDate.month(parseInt(month as string, 10) - 1).startOf('month');  // Adjust month (0-based index)
        endDate = endDate.month(parseInt(month as string, 10) - 1).endOf('month');
      }
      if (day) {
        startDate = startDate.date(parseInt(day as string, 10)).startOf('day');
        endDate = endDate.date(parseInt(day as string, 10)).endOf('day');
      }

      filter.createdAt = { $gte: startDate.toDate(), $lte: endDate.toDate() };
    }

    if (status) {
      // Ensure status matches exactly with the enum values (case-insensitive check)
      const statusUpperCase = status.toString().toUpperCase();
      if (Object.values(DeliveryStatus).includes(statusUpperCase as DeliveryStatus)) {
        filter.status = statusUpperCase; // Convert to uppercase to match database
      } else {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid status value provided'
        });
      }
    }

    // Initialize an object to track total time and count per delivery type
    let deliveryTimes: DeliveryTimes = {
      [DeliveryType.TRUCK]: { totalTime: 0, count: 0 },
      [DeliveryType.CAR]: { totalTime: 0, count: 0 },
      [DeliveryType.BICYCLE]: { totalTime: 0, count: 0 },
      [DeliveryType.BIKE]: { totalTime: 0, count: 0 },
      [DeliveryType.PERSON]: { totalTime: 0, count: 0 },
      [DeliveryType.Taxi]: { totalTime: 0, count: 0 },
      [DeliveryType.AirPlane]: { totalTime: 0, count: 0 }
    };

    // Fetch filtered parcels with pagination
    const parcels = await ParcelRequest.find(filter)
      .skip(skip)
      .limit(limitNumber)
      .lean();

    // If no parcels are found
    if (parcels.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No parcels found'
      });
    }

    // Calculate delivery time for each parcel and aggregate by DeliveryType
    let totalDeliveryTime = 0;
    let totalParcelsCount = parcels.length;
    let users: Set<string> = new Set();  // Track unique users

    parcels.forEach((parcel: any) => {
      if (parcel.deliveryStartTime && parcel.deliveryEndTime) {
        const deliveryTime = (new Date(parcel.deliveryEndTime).getTime() - new Date(parcel.deliveryStartTime).getTime()) / 1000 / 60; // Delivery time in minutes
        totalDeliveryTime += deliveryTime;

        // Track unique users based on senderId
        if (parcel.senderId) {
          users.add(parcel.senderId.toString());
        }

        // Aggregate the delivery time by delivery type
        if (parcel.deliveryType && deliveryTimes[parcel.deliveryType as keyof DeliveryTimes]) {
          deliveryTimes[parcel.deliveryType as keyof DeliveryTimes].totalTime += deliveryTime;
          deliveryTimes[parcel.deliveryType as keyof DeliveryTimes].count += 1;
        }
      }
    });

    // Calculate average delivery time (in minutes)
    const averageDeliveryTimeInMinutes = totalDeliveryTime / totalParcelsCount;

    // Convert total average delivery time to hours, minutes, and days
    const hours = Math.floor(averageDeliveryTimeInMinutes / 60);
    const minutes = Math.floor(averageDeliveryTimeInMinutes % 60);
    const days = Math.floor(averageDeliveryTimeInMinutes / (24 * 60)); // Rough estimate in days

    // Calculate average delivery time for each delivery type
    const averageDeliveryTimes = Object.keys(deliveryTimes).map((deliveryType: string) => {
      const type = deliveryTimes[deliveryType as keyof typeof deliveryTimes];
      return {
        deliveryType,
        totalDeliveryTime: type.totalTime,
        averageDeliveryTime: type.count > 0 ? type.totalTime / type.count : 0
      };
    });

    // Average order per user calculation
    const averageOrdersPerUser = totalParcelsCount / users.size;

    // Count total parcels for pagination metadata
    const totalParcels = await ParcelRequest.countDocuments(filter);
    const totalPages = Math.ceil(totalParcels / limitNumber);

    // Return the response
    res.status(200).json({
      status: 'success',
      data: {
        averageOrdersPerUser: averageOrdersPerUser, // Average number of orders per user
        totalAverageDeliveryTime: {
          days,
          hours,
          minutes
        },
        averageDeliveryTimes, // Average delivery time per delivery type
      },
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



export const getParcelDetailsById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { parcelId } = req.params;  // Extract parcelId from the URL parameters

    // Log the received parcelId (optional for debugging)
    console.log("Fetching details for parcel ID:", parcelId);

    // Fetch the parcel by parcelId and populate the sender, receiver, and assigned deliverer details
    const parcel = await ParcelRequest.findById(parcelId)
      .populate({
        path: 'senderId',  // Populate sender details
        select: 'fullName email mobileNumber profileImage role',  // Select specific fields from User model
      })
      .populate({
        path: 'receiverId',  // Populate receiver details
        select: 'fullName email mobileNumber profileImage role',  // Select specific fields from User model
      })
      .populate({
        path: 'assignedDelivererId',  // Populate assigned deliverer details
        select: 'fullName email mobileNumber profileImage role',  // Select specific fields from User model
      })
      .populate({
        path: 'deliveryRequests',  // Populate users who requested the delivery
        select: 'fullName email mobileNumber profileImage role',  // Select specific fields from User model
      })
      .select('pickupLocation deliveryLocation title description price status deliveryType deliveryStartTime deliveryEndTime images senderId receiverId assignedDelivererId deliveryRequests')  // Select necessary parcel fields
      .lean();

    // If the parcel is not found
    if (!parcel) {
      return res.status(404).json({
        status: 'error',
        message: `Parcel with ID '${parcelId}' not found.`
      });
    }

    // Return the parcel details along with sender, receiver, and deliverer information
    res.status(200).json({
      status: 'success',
      message: 'Parcel details fetched successfully.',
      data: parcel,
    });
  } catch (error) {
    console.error('❌ Error fetching parcel details:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
      error: error,
    });
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