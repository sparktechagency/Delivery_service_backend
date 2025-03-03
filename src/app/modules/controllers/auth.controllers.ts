import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
// import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import twilio from 'twilio';
import { config } from '../../../config/index';
import { User } from '../../models/user.model';
import { OTPVerification } from '../../models/OTPVerification';
import { AppError } from '../../middlewares/error';
import { UserRole } from '../../../types/index';
import { JWTPayload } from '../../middlewares/auth';

// // Initialize Twilio client
const twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);

// Function to format phone numbers to E.164
const formatPhoneNumber = (number: string): string => {
  if (!number.startsWith('+')) {
    return `+88${number.replace(/\D/g, '')}`; // Ensure it's E.164 format
  }
  return number;
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fullName, mobileNumber } = req.body;

    if (!mobileNumber) {
      throw new AppError('Mobile number is required', 400);
    }

    const formattedNumber = formatPhoneNumber(mobileNumber);
    console.log("Formatted Phone Number:", formattedNumber); // Debugging

    const existingUser = await User.findOne({ mobileNumber: formattedNumber });
    if (existingUser) {
      throw new AppError('Mobile number already registered', 400);
    }

    const user = await User.create({ fullName, mobileNumber: formattedNumber });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await OTPVerification.create({
      userId: user._id,
      mobileNumber: formattedNumber,
      otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    try {
      // const response = await twilioClient.verify.v2
      //   .services(config.twilio.verifyServiceSid)
      //   .verifications.create({
      //     from: "config.twilio.phoneNumber",
      //     to: formattedNumber,
      //     channel: 'sms'
      //   });

      const res = await twilioClient.messages.create({
        body: `Your OTP is ${otpCode}`,
        from: "+15157094117",
        to: formattedNumber
      });
      

      console.log("Twilio Response:", res); // Debugging response
    } catch (twilioError) {
      console.error("Twilio API Error:", twilioError);
      throw new AppError("Failed to send OTP. Check Twilio settings.", 500);
    }

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully. Please verify your mobile number.'
    });
  } catch (error) {
    next(error);
  }
};


// const twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);

/**
 * Format phone number to E.164 standard
 */



// const twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);

// /**
//  * Format phone number to E.164 standard
//  */
// const formatPhoneNumber = (number: string): string => {
//   let formatted = number.replace(/\D/g, "");
//   if (!formatted.startsWith("88")) {
//     formatted = `88${formatted}`;
//   }
//   return `+${formatted}`;
// };

/**
 * Register User and Send OTP
 */

// export const register = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { fullName, mobileNumber } = req.body;

//     if (!mobileNumber) {
//       throw new AppError("Mobile number is required", 400);
//     }

//     const formattedNumber = formatPhoneNumber(mobileNumber);
//     console.log("Formatted Phone Number:", formattedNumber); // Debugging

//     const existingUser = await User.findOne({ mobileNumber: formattedNumber });
//     if (existingUser) {
//       throw new AppError("Mobile number already registered", 400);
//     }

//     const user = await User.create({ fullName, mobileNumber: formattedNumber });

//     // Generate OTP
//     const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
//     console.log("Generated OTP (Before Hashing):", otpCode);

//     // Hash OTP before saving
//     const hashedOTP = await bcrypt.hash(otpCode, 10);
//     console.log("Hashed OTP (Stored in DB):", hashedOTP);

//     // Save OTP to database
//     await OTPVerification.create({
//       userId: user._id,
//       mobileNumber: formattedNumber,
//       otpCode: hashedOTP,
//       expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Expires in 10 minutes
//     });

//     try {
//       // Send OTP via Twilio
//       const response = await twilioClient.messages.create({
//         body: `Your OTP is ${otpCode}`,
//         from: "+16812502941",
//         to: formattedNumber,
//       });

//       console.log("Twilio Response:", response.sid);
//     } catch (twilioError) {
//       console.error("Twilio API Error:", twilioError);
//       throw new AppError("Failed to send OTP. Check Twilio settings.", 500);
//     }

//     res.status(201).json({
//       status: "success",
//       message: "User registered successfully. Please verify your mobile number.",
//     });
//   } catch (error) {
//     next(error);
//   }
// };


/**
 * Verify OTP and activate user account.
 */
// export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { mobileNumber, otpCode } = req.body;

//     if (!mobileNumber || !otpCode) {
//       throw new AppError('Mobile number and OTP code are required', 400);
//     }

//     const formattedNumber = formatPhoneNumber(mobileNumber);

//     const verification = await OTPVerification.findOne({
//       mobileNumber: formattedNumber,
//       otpCode,
//       expiresAt: { $gt: new Date() }
//     });

//     if (!verification) {
//       throw new AppError('Invalid or expired OTP', 400);
//     }

//     await User.findByIdAndUpdate(verification.userId, { isVerified: true });
//     await OTPVerification.deleteOne({ _id: verification._id });

//     res.json({
//       status: 'success',
//       message: 'Mobile number verified successfully'
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const formatPhoneNumber = (number: string): string => {
//   if (!number.startsWith("+")) {
//     return `+88${number.replace(/\D/g, "")}`; // Ensure it's in E.164 format
//   }
//   return number;
// };

/**
 * Verify OTP and activate user account.
 */
export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mobileNumber, otpCode } = req.body;

    if (!mobileNumber || !otpCode) {
      throw new AppError("Mobile number and OTP code are required", 400);
    }

    const formattedNumber = formatPhoneNumber(mobileNumber);
    console.log("Verifying OTP for:", formattedNumber, "with OTP:", otpCode); // Debugging

    // Find OTP entry
    const verification = await OTPVerification.findOne({
      mobileNumber: formattedNumber,
      expiresAt: { $gt: new Date() }, // Ensure OTP is not expired
    });

    if (!verification) {
      console.log("OTP verification failed: No record found or expired OTP.");
      throw new AppError("Invalid or expired OTP", 400);
    }

    console.log("User Entered OTP:", otpCode);
    console.log("Stored OTP Hash from DB:", verification.otpCode);
    console.log("Current Time:", new Date());
    console.log("Stored Expiry Time:", verification.expiresAt);

    // Compare hashed OTP with user-entered OTP
    const isMatch = await bcrypt.compare(otpCode, verification.otpCode);
    if (!isMatch) {
      console.log("OTP verification failed: Incorrect OTP.");
      throw new AppError("Invalid OTP", 400);
    }

    // Update user as verified
    await User.findByIdAndUpdate(verification.userId, { isVerified: true });

    // Delete OTP entry after successful verification
    await OTPVerification.deleteOne({ _id: verification._id });

    res.json({
      status: "success",
      message: "Mobile number verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login a user.
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mobileNumber, password } = req.body;

    if (!mobileNumber) {
      throw new AppError('Mobile number is required', 400);
    }

    const formattedNumber = formatPhoneNumber(mobileNumber);

    const user = await User.findOne({ mobileNumber: formattedNumber });
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
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password - Send OTP for password reset.
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      throw new AppError('Mobile number is required', 400);
    }

    const formattedNumber = formatPhoneNumber(mobileNumber);

    const user = await User.findOne({ mobileNumber: formattedNumber });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await OTPVerification.create({
      userId: user._id,
      mobileNumber: formattedNumber,
      otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    // Send OTP via Twilio
    await twilioClient.verify.v2
      .services(config.twilio.verifyServiceSid)
      .verifications.create({
        to: formattedNumber,
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

/**
 * Reset password using OTP.
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mobileNumber, otpCode, newPassword } = req.body;

    if (!mobileNumber || !otpCode || !newPassword) {
      throw new AppError('All fields are required', 400);
    }

    const formattedNumber = formatPhoneNumber(mobileNumber);

    const verification = await OTPVerification.findOne({
      mobileNumber: formattedNumber,
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
