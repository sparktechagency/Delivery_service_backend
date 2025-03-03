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
import { UserRole } from '../../types/index';
import { IUser } from '../../types/interfaces';
import { User } from '../models/user.model';
import { Admin } from '../models/admin';
export interface JWTPayload {
  id: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: IUser; // Define user object
}

// export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) {
//       throw new AppError('Authentication required', 401);
//     }

//     let decoded: JWTPayload;
//     try {
//       decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
//     } catch (error) {
//       throw new AppError('Invalid or expired token', 401);
//     }

//     const user = await User.findById(decoded.id);
//     if (!user) {
//       throw new AppError('User not found', 404);
//     }

//     // 🔹 Ensure the user has verified their account
//     if (!user.isVerified) {
//       throw new AppError('Account not verified. Please complete OTP verification.', 403);
//     }

//     req.user = {
//       id: user.id,
//       role: user.role,
//       username: user.fullName,
//       phoneNumber: user.mobileNumber,
//       email: user.email,
//       senderType: user.senderType,
//       isVerified: user.isVerified,
//       freeDeliveries: user.freeDeliveries,
//       createdAt: user.createdAt,
//       updatedAt: user.updatedAt,
//     } as IUser;

//     next();
//   } catch (error) {
//     next(error);
//   }
// };

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }

    let user;
    if (decoded.role === UserRole.ADMIN) {
      user = await Admin.findById(decoded.id);
    } else {
      user = await User.findById(decoded.id);
    }

    if (!user) {
      throw new AppError('User not found', 404);
    }

    req.user = {
      id: user.id,
      role: user.role,
      username: user.fullName,
      
    } as IUser;
    next();
  } catch (error) {
    next(error);
  }
};
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError('Unauthorized', 403);
    }
    next();
  };
};



export const generateTokens = (userId: string, role: UserRole) => {
  const accessToken = jwt.sign({ id: userId, role }, config.jwtSecret, { expiresIn: '1h' }); // 🔹 Short-lived token (1 hour)
  const refreshToken = jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: '7d' }); // 🔹 Long-lived token (7 days)

  return { accessToken, refreshToken };
};

