import { Request, Response, NextFunction } from 'express';
import 'dotenv/config'; // Ensure environment variables are loaded
import nodemailer from 'nodemailer';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';  // Correct import for AWS SDK v3
import { sendOTP } from "../../../util/awsSNS";
import bcrypt from 'bcryptjs';
// import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import twilio from 'twilio';
import { config } from '../../../config/index';
import { User } from './user.model';
import { OTPVerification } from '../../models/OTPVerification';
import { AppError } from '../../middlewares/error';
import { UserRole } from '../../../types/enums';
import { AuthRequest, JWTPayload } from '../../middlewares/auth';
import { emailHelper } from '../../../util/mailer/mailer'; 
import { formatPhoneNumber } from "../../../util/formatPhoneNumber";
import { UserActivity } from './user.activity.model';



export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fullName, mobileNumber, country } = req.body;

    if (!mobileNumber) {
      throw new AppError("Mobile number is required", 400);
    }

    const formattedNumber = formatPhoneNumber(mobileNumber);

    const existingUser = await User.findOne({ mobileNumber: formattedNumber });
    if (existingUser) {
      throw new AppError("Mobile number already registered", 400);
    }

    const user = await User.create({ fullName,country, mobileNumber: formattedNumber });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await OTPVerification.create({
      userId: user._id,
      mobileNumber: formattedNumber,
      otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Send OTP via AWS SNS
    await sendOTP(formattedNumber, otpCode);

    res.status(201).json({
      status: "success",
      message: "User registered successfully. Please verify your mobile number.",
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mobileNumber, otpCode } = req.body;

    if (!mobileNumber || !otpCode) {
      throw new AppError('Mobile number and OTP code are required', 400);
    }

    const formattedNumber = formatPhoneNumber(mobileNumber);

    const verification = await OTPVerification.findOne({
      mobileNumber: formattedNumber,
      otpCode,
      expiresAt: { $gt: new Date() },
    });

    if (!verification) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    await User.findByIdAndUpdate(verification.userId, { isVerified: true });
    await OTPVerification.deleteOne({ _id: verification._id });

    res.json({
      status: 'success',
      message: 'Mobile number verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mobileNumber, fcmToken } = req.body;

    if (!mobileNumber) {
      throw new AppError('Mobile number is required', 400);
    }

    const formattedNumber = formatPhoneNumber(mobileNumber);
    const user = await User.findOne({ mobileNumber: formattedNumber });

    if (!user || !user.isVerified) {
      throw new AppError('Invalid credentials or unverified account', 401);
    }

    if (fcmToken) {
      user.fcmToken = fcmToken;
      await user.save();
    }
    

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await OTPVerification.create({
      userId: user._id,
      mobileNumber: formattedNumber,
      otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOTP(formattedNumber, otpCode);

    res.json({
      status: 'success',
      message: 'OTP sent for login verification.',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyLoginOTPNumber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mobileNumber, otpCode } = req.body;

    if (!mobileNumber || !otpCode) {
      throw new AppError('Mobile number and OTP code are required', 400);
    }

    const formattedNumber = formatPhoneNumber(mobileNumber);
    const verification = await OTPVerification.findOne({
      mobileNumber: formattedNumber,
      otpCode,
      expiresAt: { $gt: new Date() },
    });

    if (!verification) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    const user = await User.findOne({ mobileNumber: formattedNumber });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const token = jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET!, { expiresIn: '20d' });

    await OTPVerification.deleteOne({ _id: verification._id });

    res.json({
      status: 'success',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          mobileNumber: user.mobileNumber,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});


//  * Email Registration with OTP Verification

export const registerWithEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fullName, country,email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const user = await User.create({ fullName,country, email, isVerified: false });


    await OTPVerification.deleteMany({ email });


    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    console.log("🔹 Generated OTP (Plain):", otpCode);

    
    const otpVerification = await OTPVerification.create({
      userId: user._id,
      email,
      otpCode, 
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // ✅ Send the **plain OTP** via email
    await emailHelper.sendEmail({
      to: email,
      subject: 'Verify Your Email',
      html: `<p>Your OTP for verification is: <strong>${otpCode}</strong></p>`,
    });

    console.log('OTP Generation Details:', {
      email,
      plainOTP: otpCode,
      otpVerificationId: otpVerification._id
    });

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully. Please verify your email.',
    });
  } catch (error) {
    console.error('Registration Error:', error);
    next(error);
  }
};


export const verifyEmailOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otpCode } = req.body;
    console.log("🔹 User Entered OTP:", otpCode);

    if (!email || !otpCode) {
      throw new AppError('Email and OTP code are required', 400);
    }

    // ✅ Fetch the latest OTP entry for the email
    const verification = await OTPVerification.findOne({
      email,
      expiresAt: { $gt: new Date() }, // Ensure OTP is not expired
    }).sort({ createdAt: -1 }).lean(); // ✅ Ensures a plain object

    console.log("🔹 Retrieved Verification Data:", verification);

    if (!verification) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    console.log("🔹 Stored OTP from DB:", verification.otpCode);

    // ✅ Compare the entered OTP with the stored OTP
    if (otpCode !== verification.otpCode) {
      throw new AppError('Invalid OTP', 400);
    }

    // ✅ Mark user as verified
    await User.findOneAndUpdate({ email }, { isVerified: true });

    // ✅ Delete OTP record after successful verification
    await OTPVerification.deleteOne({ _id: verification._id });

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('This email Are Not exist', 404);
    }
    const payload: JWTPayload = {
      id: user._id.toString(),
      role: user.role as UserRole,
    };

    // ✅ Generate JWT token after successful OTP verification
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '20d' });

    res.json({ 
      token,
      status: 'success', 
      message: 'Email verified successfully'
      
    });
  } catch (error) {
    console.error('Verification Error:', error);
    next(error);
  }
};

export const loginWithEmailOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email,fcmToken } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const user = await User.findOne({ email });
    if (!user || !user.isVerified) {
      throw new AppError('Invalid credentials or unverified account', 401);
    }

    // Check if user is restricted
    if (user.isRestricted) {
      throw new AppError('Your profile is restricted. Please contact support team.', 403); // Restricted account error
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    //! OTP Expired
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    let otp = await OTPVerification.findOne({ userId: user._id, email });
  
    if (fcmToken) {
      user.fcmToken = fcmToken;
      await user.save(); 
    }
    

    if (otp) {
      otp.otpCode = otpCode; 
      otp.expiresAt = otpExpiry; 

      await otp.save(); 
    } else {
      await OTPVerification.create({
        userId: user._id,
        email,
        otpCode,
        expiresAt: otpExpiry, 
      });
    }

    // Send OTP via email
    await transporter.sendMail({
      from: config.email.user,
      to: email,
      subject: 'Your Login OTP',
      text: `Your OTP for login is: ${otpCode}`,
    });

    res.json({ status: 'success', message: 'OTP sent to your email' });
  } catch (error) {
    next(error);
  }
};

// export const loginWithEmailOTP = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { email, otpCode } = req.body;

//     if (!email || !otpCode) {
//       throw new AppError('Email and OTP code are required', 400);
//     }

//     // Fetch the latest OTP entry for the email
//     const verification = await OTPVerification.findOne({
//       email,
//       expiresAt: { $gt: new Date() }, // Ensure OTP is not expired
//     });

//     if (!verification || verification.otpCode !== otpCode) {
//       throw new AppError('Invalid or expired OTP', 400);
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       throw new AppError('User not found', 404);
//     }

//     // Track the user login activity
//     const loginTime = new Date(); // Get current time
//     await UserActivity.create({
//       userId: user._id,
//       loginTime, // Log the login time
//     });

//     const payload: JWTPayload = {
//       id: user._id.toString(),
//       role: user.role as UserRole,
//     };

//     // Generate JWT token after successful OTP verification
//     const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });

//     // Delete OTP record after successful verification
//     await OTPVerification.deleteOne({ _id: verification._id });

//     res.json({
//       status: 'success',
//       data: {
//         token,
//         user: {
//           id: user._id,
//           fullName: user.fullName,
//           email: user.email,
//           role: user.role,
//         },
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };


export const verifyLoginOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) {
      throw new AppError('Email and OTP code are required', 400);
    }

    const verification = await OTPVerification.findOne({
      email,
      expiresAt: { $gt: new Date() },
    });

    if (!verification || verification.otpCode !== otpCode) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const payload: JWTPayload = {
      id: user._id.toString(),
      role: user.role as UserRole,
    };

    // ✅ Generate JWT token after successful OTP verification
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '20d' });

    // ✅ Delete OTP record after successful verification
    await OTPVerification.deleteOne({ _id: verification._id });

    res.json({
      status: 'success',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


// export const googleLoginOrRegister = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { googleId, fullName, email, profileImage } = req.body; // Assuming these are coming from Google OAuth

//     if (!googleId || !email || !fullName) {
//       throw new AppError('Missing Google credentials', 400);
//     }

//     // Check if the user already exists in the database
//     let user = await User.findOne({ email });

//     if (!user) {
//       // If user does not exist, create a new user
//       user = await User.create({
//         fullName,
//         email,
//         googleId,        // Store the Google ID for reference
//         profileImage: profileImage || '', // Store the profile image if available
//         isVerified: true, // Automatically mark as verified, as no OTP is required for Google login
//         isRestricted: false, // By default, set the user as not restricted
//         role: 'receiver',  // Assuming default role is 'receiver'; you can change based on your use case
//       });

//       // Send the response after user creation
//       return res.status(201).json({
//         status: 'success',
//         message: 'User registered successfully with Google.',
//         data: user,
//       });
//     }

//     // If user exists, log them in automatically
//     res.status(200).json({
//       status: 'success',
//       message: 'User logged in successfully with Google.',
//       data: user, // Return user data, including profile information
//     });
//   } catch (error) {
//     next(error);
//   }
// };

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'your_secret_key_here'; 

export const googleLoginOrRegister = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { googleId, fullName, email, profileImage } = req.body;

    if (!googleId || !email || !fullName) {
      throw new AppError('Missing Google credentials', 400);
    }
    let user = await User.findOne({ email });

    if (!user) {

      user = await User.create({
        fullName,
        email,
        googleId,      
        profileImage: profileImage || '', 
        isVerified: true,
        isRestricted: false, 
        role: 'receiver', 
      });


      const token = jwt.sign({ userId: user._id }, JWT_SECRET_KEY, { expiresIn: '20d' });

      return res.status(201).json({
        status: 'success',
        message: 'User registered successfully with Google.',
        data: {
          user,
          token,
        },
      });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET_KEY, { expiresIn: '20d' });

    return res.status(200).json({
      status: 'success',
      message: 'User logged in successfully with Google.',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error('Error during Google login or registration:', error); 
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ status: 'error', message: error.message });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error. Please try again later.',
    });
  }
};