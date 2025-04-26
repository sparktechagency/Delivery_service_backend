
// //auth.ts
// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';
// import { config } from '../../config/index';
// import { AppError } from './error';
// import { UserRole } from '../../types/index';
// import { IUser } from '../../types/interfaces';
// import { User } from '../models/user.model';

// export interface JWTPayload {
//   id: string;
//   role: UserRole;
// }

// export interface AuthRequest extends Request {
//   headers: any;
//   // user?: JWTPayload;
//   user?: IUser
// }

// export const authenticate = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) {
//       throw new AppError('Authentication required', 401);
//     }

//     const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
//     // req.user = decoded;
//     const user = await User.findById(decoded.id);
//     if (!user) {
//       throw new AppError('User not found', 404);
//     }

//     req.user = {
//       id: user.id,
//       role: user.role,
//       username: user.fullName, // Map `fullName` to `username`
//       phoneNumber: user.mobileNumber,
//       email: user.email,
//       senderType: user.senderType,
//       isVerified: user.isVerified,
//       freeDeliveries: user.freeDeliveries,
//       createdAt: user.createdAt,
//       updatedAt: user.updatedAt
//     } as IUser;


//     next();
//   } catch (error) {
//     next(new AppError('Invalid token', 401));
//   }
// };

// export const authorize = (...roles: UserRole[]) => {
//   return (req: AuthRequest, res: Response, next: NextFunction) => {
//     if (!req.user || !roles.includes(req.user.role)) {
//       throw new AppError('Unauthorized', 403);
//     }
//     next();
//   };
// };

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index';
import { AppError } from './error';
import { UserRole } from '../../types/enums';
import { IUser } from '../../types/interfaces';
import { User } from '../modules/user/user.model';
import { Admin } from '../modules/admin/admin.model';
import path from 'path';
import fs from 'fs';
import { Subscription } from "../models/subscription.model";

// import { Document} from "../models/subscription.model";//-
import { Document } from "mongoose";//+



export interface JWTPayload {
  id: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: IUser; // Define user object
}


export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("🔹 Authorization Header:", authHeader); // Debugging

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    console.log("🔹 Extracted Token:", token); // Debugging

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
      console.log("🔹 Decoded Token:", decoded); // Debugging
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }

    let user;
    if (decoded.role === UserRole.ADMIN) {
      user = await Admin.findById(decoded.id);  // Check if the role is ADMIN
    } else {
      user = await User.findById(decoded.id);   // For non-admin users
    }

    if (!user) {
      throw new AppError('User not found', 404);
    }

    req.user = {
      id: user.id,
      role: user.role,  // Ensure role is passed in `req.user`
      username: user.fullName,
    } as IUser;

    console.log("🔹 Authenticated User:", req.user);

    next();
  } catch (error) {
    console.error("❌ Authentication Error:", error); // Debugging
    next(error);
  }
};

// export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       throw new AppError('Authentication required', 401);
//     }

//     const token = authHeader.split(' ')[1];
//     let decoded: JWTPayload;
//     try {
//       decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
//     } catch (error) {
//       throw new AppError('Invalid or expired token', 401);
//     }

//     let user;
//     if (decoded.role.toLowerCase() === UserRole.ADMIN.toLowerCase()) {
//       user = await Admin.findById(decoded.id);
//     } else {
//       user = await User.findById(decoded.id);
//     }

//     if (!user) {
//       throw new AppError('User not found', 404);
//     }

//     req.user = {
//       id: user.id,
//       role: user.role.toUpperCase(),  // Ensure it's uppercase
//       username: user.fullName,
//     } as IUser;

//     next();
//   } catch (error) {
//     next(error);
//   }
// };


// export const authorize = (...roles: UserRole[]) => {
//   return (req: AuthRequest, res: Response, next: NextFunction) => {
//     if (!req.user || !roles.includes(req.user.role)) {
//       throw new AppError('Unauthorized', 403);
//     }
//     next();
//   };
// };


export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role?.toUpperCase(); // Normalize role case
    const allowedRoles = roles.map(role => role.toUpperCase()); // Normalize allowed roles

    console.log("🔹 User Role from Token:", userRole);
    console.log("🔹 Allowed Roles:", allowedRoles);

    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new AppError('Unauthorized', 403);
    }
    
    next();
  };
};






export const generateTokens = (userId: string, role: UserRole) => {
  const accessToken = jwt.sign({ id: userId, role }, config.jwtSecret, { expiresIn: '24h' });
  const refreshToken = jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: '7d' });

  console.log("🔹 Generated Access Token:", accessToken); // Debugging
  console.log("🔹 Generated Refresh Token:", refreshToken); // Debugging

  return { accessToken, refreshToken };
};



// export const updateProfileMiddleware = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     console.log("📄 Received Body:", req.body);  // Log form data
//     console.log("📂 Received File:", req.file);  // Log file data

//     const userId = req.user?.id;  
//     const { name, email, facebook, instagram, whatsapp } = req.body;  // Extract form data fields

//     if (!userId) {
//       return res.status(401).json({
//         status: "error",
//         message: "Unauthorized"
//       });
//     }

//     // Find the user by ID
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         status: "error",
//         message: "User not found"
//       });
//     }

//     // Update the user's fields
//     if (name) user.fullName = name;
//     if (email) user.email = email;
//     if (facebook) user.facebook = facebook;
//     if (instagram) user.instagram = instagram;
//     if (whatsapp) user.whatsapp = whatsapp;

//     if (req.file) {
//       user.profileImage = `/uploads/profiles/${req.file.filename}`;
     
//     }

//     await user.save();

//     const updatedUser = await User.findById(userId).select('-passwordHash');

//     res.status(200).json({
//       status: "success",
//       message: "Profile updated successfully",
//       data: updatedUser,
//     });
//   } catch (error: any) {
//     console.error("❌ Error Updating Profile:", error);
//     res.status(500).json({
//       status: "error",
//       message: error.message || "An error occurred while updating profile"
//     });
//   }
// };

// export const checkUserSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const userId = req.user?.id;

//     if (!userId) {
//       return res.status(401).json({
//         status: "error",
//         message: "Unauthorized"
//       });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         status: "error",
//         message: "User not found"
//       });
//     }

//     if (!user.isSubscribed) {
//       return res.status(403).json({
//         status: "error",
//         message: "Subscription required"
//       });
//     }

//     next();
//   } catch (error: any) {
//     console.error("❌ Error Checking Subscription:", error);
//     res.status(500).json({
//       status: "error",
//       message: error.message || "An error occurred while checking subscription"
//     });
//   }
// };
