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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }

    let user;
    if (decoded.role.toLowerCase() === UserRole.ADMIN.toLowerCase()) {
      user = await Admin.findById(decoded.id);
    } else {
      user = await User.findById(decoded.id);
    }

    if (!user) {
      throw new AppError('User not found', 404);
    }

    req.user = {
      id: user.id,
      role: user.role.toUpperCase(),  // Ensure it's uppercase
      username: user.fullName,
    } as IUser;

    next();
  } catch (error) {
    next(error);
  }
};

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
  const accessToken = jwt.sign({ id: userId, role }, config.jwtSecret, { expiresIn: '30d' });
  const refreshToken = jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: '7d' });

  console.log("🔹 Generated Access Token:", accessToken); // Debugging
  console.log("🔹 Generated Refresh Token:", refreshToken); // Debugging

  return { accessToken, refreshToken };
};

