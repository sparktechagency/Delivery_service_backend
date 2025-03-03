// admin.controller.ts
import { Request, Response, NextFunction } from 'express';

interface AdminRequest extends Request {
  admin?: {
    id: string;
  };
}
import bcrypt from 'bcryptjs';
import { Admin } from '../../models/admin';
import { AppError } from '../../middlewares/error';
import { Order } from '../../models/order.model';
import { Report } from '../../models/report.model';
import { Subscription } from '../../models/subscription.model';
import { User } from '../../models/user.model';
import { UserRole } from '../../../types';
import { config } from 'process';
import jwt from 'jsonwebtoken';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const createAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fullName, email, password, dob, permanentAddress, postalCode, username } = req.body;
      
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
        role: UserRole.ADMIN,
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

  // Change Admin Password
  export const changeAdminPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const adminId = req.user?.id;
  
      if (!adminId) throw new AppError('Unauthorized', 401);
  
      const admin = await Admin.findById(adminId);
      if (!admin) throw new AppError('Admin not found', 404);
  
      const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
      if (!isMatch) throw new AppError('Incorrect current password', 400);
      if (newPassword !== confirmPassword) throw new AppError('New passwords do not match', 400);
  
      admin.passwordHash = await bcrypt.hash(newPassword, 10);
      await admin.save();
  
      res.json({ status: 'success', message: 'Password changed successfully' });
    } catch (error) {
  
    }
  };
  
  
 
export const updateAdminProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, email, dob, permanentAddress, postalCode, username } = req.body;
      const image = req.file; // Uploaded image file
  
      console.log("📄 Received Body:", req.body);
      console.log("📂 Received File:", image);
  
      const admin = await Admin.findById(id);
      if (!admin) throw new AppError('Admin not found', 404);
  
      admin.fullName = name || admin.fullName;
      admin.email = email || admin.email;
      admin.dob = dob ? new Date(dob) : admin.dob;
      admin.permanentAddress = permanentAddress || admin.permanentAddress;
      admin.postalCode = postalCode || admin.postalCode;
      admin.username = username || admin.username;
  
      if (image) {
        const uploadPath = `uploads/profiles/${Date.now()}-${image.originalname}`;
        fs.writeFileSync(uploadPath, image.buffer);
        admin.profileImage = `/${uploadPath}`; // Save file path
        console.log("✅ Profile Image Saved:", admin.profileImage);
      }
  
      await admin.save();
  
      const updatedAdmin = await Admin.findById(id).select('-passwordHash'); // Fetch updated data without password hash
      res.json({ status: 'success', message: 'Profile updated successfully', data: updatedAdmin });
    } catch (error) {
      console.error("❌ Profile Update Error:", error);
      next(error);
    }
  };

  //get admin profile
  export const getAdminProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        console.log("📌 Received Admin ID:", id);

        // Validate ID format (Ensure it's a valid MongoDB ObjectId)
        if (!id || id.length !== 24) {
            throw new AppError('Invalid admin ID', 400);
        }

        const admin = await Admin.findById(id).select('-passwordHash');

        if (!admin) {
            console.log("⚠️ Admin Not Found in Database");
            throw new AppError('Admin not found', 404);
        }

        console.log("✅ Admin Found:", admin);

        res.json({ status: 'success', data: admin });
    } catch (error) {
        console.error("❌ Error Fetching Admin:", error);
        next(error);
    }
};

  
  
  
  // Update: User Hold & Review Admin Updates
  export const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, isRestricted } = req.body;
      const user = await User.findById(userId);
      if (!user) throw new AppError('User not found', 404);
  
      user.isRestricted = isRestricted;
      await user.save();
  
      res.json({ status: 'success', message: isRestricted ? 'User is restricted' : 'User is active' });
    } catch (error) {
      next(error);
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
    const { orderId, status } = req.query;
    const filter: any = {};
    if (orderId) filter._id = orderId;
    if (status) filter.status = status;

    const orders = await Order.find(filter).populate('customer deliveryPerson');
    res.json({ status: 'success', data: orders });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.find();
    res.json({ status: 'success', data: users });
  } catch (error) {
    next(error);
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