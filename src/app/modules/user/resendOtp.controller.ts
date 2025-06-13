import { Request, Response, NextFunction } from 'express';
import { User } from './user.model';
import { AppError } from '../../middlewares/error'; 
import { formatPhoneNumber } from '../../../util/formatPhoneNumber'; 
import { sendTwilioOTP } from '../../../util/twilio';

const otpAttempts = new Map<string, { count: number; lastAttempt: Date }>();

const RATE_LIMIT = {
  maxAttempts: 3, 
  windowMinutes: 15, // Time window in minutes
  cooldownMinutes: 5, // Cooldown between requests in minutes
};




export const resendOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('=== RESEND OTP (GENERIC) DEBUG ===');
    console.log('Request body:', req.body);
    
    const { mobileNumber } = req.body;

    // Validate input
    if (!mobileNumber) {
      throw new AppError("Mobile number is required", 400);
    }

    // Format phone number
    let formattedNumber: string;
    try {
      formattedNumber = formatPhoneNumber(mobileNumber);
      console.log('Original number:', mobileNumber);
      console.log('Formatted number:', formattedNumber);
    } catch (formatError: any) {
      console.error('Phone formatting error:', formatError.message);
      throw new AppError(`Invalid phone number: ${formatError.message}`, 400);
    }

    // Check if user exists
    const user = await User.findOne({ mobileNumber: formattedNumber });
    if (!user) {
      throw new AppError("User not found. Please register first.", 404);
    }

    const context = user.isVerified ? 'login' : 'registration';
    const rateLimitKey = `resend_${context}_${formattedNumber}`;
    
    console.log('OTP context:', context);
    console.log('User verified status:', user.isVerified);

    // Rate limiting check
    const now = new Date();
    const userAttempts = otpAttempts.get(rateLimitKey);

    if (userAttempts) {
      const timeDiff = (now.getTime() - userAttempts.lastAttempt.getTime()) / 1000 / 60; // minutes
      
      // Check cooldown period
      if (timeDiff < RATE_LIMIT.cooldownMinutes) {
        const remainingTime = Math.ceil(RATE_LIMIT.cooldownMinutes - timeDiff);
        throw new AppError(
          `Please wait ${remainingTime} minute(s) before requesting another OTP`, 
          429
        );
      }

      // Check if exceeded max attempts in time window
      if (timeDiff < RATE_LIMIT.windowMinutes && userAttempts.count >= RATE_LIMIT.maxAttempts) {
        const remainingTime = Math.ceil(RATE_LIMIT.windowMinutes - timeDiff);
        throw new AppError(
          `Too many OTP requests. Please try again after ${remainingTime} minute(s)`, 
          429
        );
      }

      // Reset counter if window expired
      if (timeDiff >= RATE_LIMIT.windowMinutes) {
        userAttempts.count = 0;
      }
    }

    // Send OTP via Twilio
    console.log(`Attempting to resend ${context} OTP...`);
    await sendTwilioOTP(formattedNumber);
    console.log(`${context} OTP resent successfully`);

    // Update rate limiting
    otpAttempts.set(rateLimitKey, {
      count: (userAttempts?.count || 0) + 1,
      lastAttempt: now
    });

    const message = context === 'registration' 
      ? "OTP resent successfully. Please verify to complete registration."
      : "OTP resent successfully. Please verify to complete login.";

    res.status(200).json({
      status: "success",
      message,
      userId: user._id,
      context
    });
    
    console.log('Success response sent');
    console.log('=================================');
  } catch (error) {
    console.error('=== RESEND OTP (GENERIC) ERROR ===');
    console.error('Error:', error);
    console.error('=================================');
    next(error);
  }
};


export const getOTPStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber || typeof mobileNumber !== 'string') {
      throw new AppError("Mobile number is required", 400);
    }

    const formattedNumber = formatPhoneNumber(mobileNumber);
    
    // Check if user exists
    const user = await User.findOne({ mobileNumber: formattedNumber });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const context = user.isVerified ? 'login' : 'registration';
    const rateLimitKey = `resend_${context}_${formattedNumber}`;
    const userAttempts = otpAttempts.get(rateLimitKey);
    
    const now = new Date();
    let status = {
      canResend: true,
      attemptsRemaining: RATE_LIMIT.maxAttempts,
      cooldownMinutes: 0,
      context
    };

    if (userAttempts) {
      const timeDiff = (now.getTime() - userAttempts.lastAttempt.getTime()) / 1000 / 60; // minutes
      
      // Check if in cooldown period
      if (timeDiff < RATE_LIMIT.cooldownMinutes) {
        status.canResend = false;
        status.cooldownMinutes = Math.ceil(RATE_LIMIT.cooldownMinutes - timeDiff);
      }
      // Check if exceeded max attempts in time window
      else if (timeDiff < RATE_LIMIT.windowMinutes && userAttempts.count >= RATE_LIMIT.maxAttempts) {
        status.canResend = false;
        status.cooldownMinutes = Math.ceil(RATE_LIMIT.windowMinutes - timeDiff);
        status.attemptsRemaining = 0;
      }
      // Reset counter if window expired
      else if (timeDiff >= RATE_LIMIT.windowMinutes) {
        status.attemptsRemaining = RATE_LIMIT.maxAttempts;
      } else {
        status.attemptsRemaining = RATE_LIMIT.maxAttempts - userAttempts.count;
      }
    }

    res.json({
      status: "success",
      data: status
    });
  } catch (error) {
    next(error);
  }
};