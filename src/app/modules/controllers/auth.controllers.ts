import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import twilio from 'twilio';
import { config } from '../../../config/index';
import { User } from '../../models/user.model';
import { OTPVerification } from '../../models/OTPVerification';
import { AppError } from '../../middlewares/error';
import { UserRole } from '../../../types/index';
import { JWTPayload } from '../../middlewares/auth';

const twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fullName, mobileNumber, role } = req.body;

    const existingUser = await User.findOne({ mobileNumber });
    if (existingUser) {
      throw new AppError('Mobile number already registered', 400);
    }

    const user = await User.create({
      fullName,
      mobileNumber,
      role
    });

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await OTPVerification.create({
      userId: user._id,
      mobileNumber,
      otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
    });

    // Send OTP via Twilio
    await twilioClient.verify.v2
      .services(config.twilio.verifyServiceSid)
      .verifications.create({
        to: mobileNumber,
        channel: 'sms'
      });

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully. Please verify your mobile number.'
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mobileNumber, otpCode } = req.body;

    const verification = await OTPVerification.findOne({
      mobileNumber,
      otpCode,
      expiresAt: { $gt: new Date() }
    });

    if (!verification) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    await User.findByIdAndUpdate(verification.userId, { isVerified: true });
    await OTPVerification.deleteOne({ _id: verification._id });

    res.json({
      status: 'success',
      message: 'Mobile number verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mobileNumber, password } = req.body;

    const user = await User.findOne({ mobileNumber });
    if (!user || !user.isVerified) {
      throw new AppError('Invalid credentials or unverified account', 401);
    }

    if (password && user.passwordHash) {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        throw new AppError('Invalid credentials', 401);
      }
    }

    const payload: JWTPayload = {
      id: user._id.toString(),
      role: user.role as UserRole
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });

    res.json({
      status: 'success',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          mobileNumber: user.mobileNumber,
          role: user.role,
          // isProfessional: user.isProfessional
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mobileNumber } = req.body;

    const user = await User.findOne({ mobileNumber });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await OTPVerification.create({
      userId: user._id,
      mobileNumber,
      otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    // Send OTP via Twilio
    await twilioClient.verify.v2
      .services(config.twilio.verifyServiceSid)
      .verifications.create({
        to: mobileNumber,
        channel: 'sms'
      });

    res.json({
      status: 'success',
      message: 'Password reset OTP sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mobileNumber, otpCode, newPassword } = req.body;

    const verification = await OTPVerification.findOne({
      mobileNumber,
      otpCode,
      expiresAt: { $gt: new Date() }
    });

    if (!verification) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(verification.userId, { passwordHash });
    await OTPVerification.deleteOne({ _id: verification._id });

    res.json({
      status: 'success',
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
};