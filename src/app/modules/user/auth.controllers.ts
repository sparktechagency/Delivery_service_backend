import { Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import nodemailer from 'nodemailer';
declare module 'express-serve-static-core' {
  interface Request {
    registeredUserId?: string;
  }
}
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { sendOTP } from "../../../util/awsSNS";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import twilio from 'twilio';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../../../config/index';
import { User } from './user.model';
import { OTPVerification } from '../../models/OTPVerification';
import { AppError } from '../../middlewares/error';
import { UserRole } from '../../../types/enums';
import { AuthRequest, generateTokens, JWTPayload } from '../../middlewares/auth';
import { emailHelper } from '../../../util/mailer/mailer'; 
import { formatPhoneNumber } from "../../../util/formatPhoneNumber";
import { UserActivity } from './user.activity.model';
import DeviceToken from './fcm.token.model';
import { StatusCodes } from 'http-status-codes';
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'your_secret_key_here'; 


const twilioClient = twilio(config.twilio.twilioAccountSid, config.twilio.twilioAuthToken);
const twilioServiceSid = config.twilio.twilioServiceSid;
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});


const sendTwilioOTP = async (mobileNumber: string): Promise<string> => {
  try {
    
    if (!config.twilio.twilioAccountSid || !config.twilio.twilioAuthToken || !twilioServiceSid) {
      throw new Error('Missing Twilio configuration');
    }
    
    const verification = await twilioClient.verify.v2
      .services(twilioServiceSid)
      .verifications.create({
        to: mobileNumber,
        channel: 'sms'
      });
    
    return verification.sid;
  } catch (error: any) {

    
    // Provide more specific error messages
    if (error.code === 20003) {
      throw new AppError('Authentication Error: Invalid Twilio credentials', 500);
    }
    if (error.code === 20404) {
      throw new AppError('Twilio Service not found: Invalid Service SID', 500);
    }
    if (error.code === 60200) {
      throw new AppError('Invalid phone number format', 400);
    }
    
    throw new AppError(`Failed to send OTP: ${error.message}`, 500);
  }
};

const verifyTwilioOTP = async (mobileNumber: string, otpCode: string): Promise<boolean> => {
  try {
    
    const verificationCheck = await twilioClient.verify.v2
      .services(twilioServiceSid)
      .verificationChecks.create({
        to: mobileNumber,
        code: otpCode
      });
    
    return verificationCheck.status === 'approved';
  } catch (error: any) {
  
    throw new AppError('OTP verification failed', 400);
  }
};

// export const register = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { fullName, mobileNumber, country, email, fcmToken, deviceId, deviceType = 'android' } = req.body;

//     if (!mobileNumber) {
//       throw new AppError("Mobile number is required", 400);
//     }

//     if (fcmToken && !deviceId) {
//       throw new AppError('deviceId is required when providing fcmToken', 400);
//     }

//     let formattedNumber: string;
//     try {
//       formattedNumber = formatPhoneNumber(mobileNumber);
//     } catch (formatError: any) {
//       throw new AppError(`Invalid phone number: ${formatError.message}`, 400);
//     }

//     // Check if mobile number already exists
//     const existingUser = await User.findOne({ mobileNumber: formattedNumber });
//     if (existingUser) {
//       throw new AppError("Mobile number already registered", 400);
//     }

//     // Check if email already exists (only if email is provided)
//     let formattedEmail = null; // Initialize as null
//     if (email && email.trim() !== "") {
//       formattedEmail = email.toLowerCase();
//       const existingEmailUser = await User.findOne({ email: formattedEmail });
//       if (existingEmailUser) {
//         throw new AppError("Email already exists", 400);
//       }
//     }

//     const user = await User.create({ 
//       fullName, 
//       country, 
//       mobileNumber: formattedNumber, 
//       email: formattedEmail,
//       isVerified: false 
//     });
//     console.log('User created:', user._id);

//     // Send OTP via Twilio
//     await sendTwilioOTP(formattedNumber);

//     if (fcmToken && deviceId) {
//       const existingToken = await DeviceToken.findOne({
//         userId: user._id,
//         deviceId: deviceId
//       });

//       if (existingToken) {
//         existingToken.fcmToken = fcmToken;
//         existingToken.deviceType = deviceType;
//         await existingToken.save();
//         console.log(`Updated FCM token for user ${user._id}, device ${deviceId}`);
//       } else {
//         await DeviceToken.create({
//           userId: user._id,
//           fcmToken,
//           deviceId,
//           deviceType
//         });
//         console.log(`Created new FCM token for user ${user._id}, device ${deviceId}`);
//       }
//     }

//     res.status(201).json({
//       status: "success",
//       message: "User registered successfully. Please verify OTP to complete registration.",
//       userId: user._id
//     });

//   } catch (error) {
//     next(error);
//   }
// };
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fullName, mobileNumber, country, email, fcmToken, deviceId, deviceType = 'android' } = req.body;

    if (!mobileNumber) {
      throw new AppError("Mobile number is required", 400);
    }

    if (fcmToken && !deviceId) {
      throw new AppError('deviceId is required when providing fcmToken', 400);
    }

    let formattedNumber: string;
    try {
      formattedNumber = formatPhoneNumber(mobileNumber);
    } catch (formatError: any) {
      throw new AppError(`Invalid phone number: ${formatError.message}`, 400);
    }
    const existingUser = await User.findOne({ mobileNumber: formattedNumber });
    if (existingUser) {
      throw new AppError("Mobile number already registered", 400);
    }
    let formattedEmail = null; // Initialize email as null (if not provided)
    if (email && email.trim() !== "") {
      formattedEmail = email.toLowerCase();
      const existingEmailUser = await User.findOne({ email: formattedEmail });
      if (existingEmailUser) {
        throw new AppError("Email already exists", 400);
      }
    }


    const user = await User.create({ 
      fullName, 
      country, 
      mobileNumber: formattedNumber, 
      email: formattedEmail,
      isVerified: false 
    });

    console.log('User created:', user._id);

    await sendTwilioOTP(formattedNumber);

    if (fcmToken && deviceId) {
      const existingToken = await DeviceToken.findOne({
        userId: user._id,
        deviceId: deviceId
      });

      if (existingToken) {
        // Update existing token
        existingToken.fcmToken = fcmToken;
        existingToken.deviceType = deviceType;
        await existingToken.save();
        console.log(`Updated FCM token for user ${user._id}, device ${deviceId}`);
      } else {
        // Create new token entry
        await DeviceToken.create({
          userId: user._id,
          fcmToken,
          deviceId,
          deviceType
        });
        console.log(`Created new FCM token for user ${user._id}, device ${deviceId}`);
      }
    }

    // Respond with a success message
    res.status(201).json({
      status: "success",
      message: "User registered successfully. Please verify OTP to complete registration.",
      userId: user._id
    });

  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    
    const { mobileNumber, fcmToken, deviceId, deviceType = 'android' } = req.body;

    if (!mobileNumber) {
      throw new AppError("Mobile number is required", 400);
    }
    
    if (fcmToken && !deviceId) {
      throw new AppError('deviceId is required when providing fcmToken', 400);
    }
    
    let formattedNumber: string;
    try {
      formattedNumber = formatPhoneNumber(mobileNumber);
    } catch (formatError: any) {
      console.error('Phone formatting error:', formatError.message);
      throw new AppError(`Invalid phone number: ${formatError.message}`, 400);
    }

    const existingUser = await User.findOne({ mobileNumber: formattedNumber });
    if (!existingUser) {
      throw new AppError("user account was not found. To continue, please create an account:", 404);
    }
    console.log('User found:', existingUser._id);

    // Send OTP via Twilio
    console.log('Attempting to send OTP...');
    await sendTwilioOTP(formattedNumber);
    console.log('OTP sent successfully');


if (fcmToken && deviceId) {
  const existingToken = await DeviceToken.findOne({
    userId: existingUser._id,
    deviceId: deviceId
  });

  if (existingToken) {
    existingToken.fcmToken = fcmToken;
    existingToken.deviceType = deviceType;
    await existingToken.save();
    console.log(`Updated FCM token for user ${existingUser._id}, device ${deviceId}`);
  } else {
    await DeviceToken.create({
      userId: existingUser._id,
      fcmToken,
      deviceId,
      deviceType
    });
    console.log(`Created new FCM token for user ${existingUser._id}, device ${deviceId}`);
  }
}


    console.log('About to send success response...');
    res.status(200).json({
      status: "success",
      message: "OTP sent successfully. Please verify to complete login.",
      userId: existingUser._id
    });
    console.log('Success response sent');
    // console.log('================');
  } catch (error) {
    // console.error('=== LOGIN ERROR ===');
    // console.error('Error in login:', error);
    // console.error('================');
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

    // Verify OTP with Twilio
    const isValidOTP = await verifyTwilioOTP(formattedNumber, otpCode);
    if (!isValidOTP) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    const user = await User.findOne({ mobileNumber: formattedNumber });
    if (!user) {
      throw new AppError('user account was not found. To continue, please create an account', 404);
    }

    await User.findByIdAndUpdate(user._id, { isVerified: true });

    const payload = {
      id: user._id.toString(),
      role: user.role,
    };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '20d' });

    res.json({
      status: 'success',
      message: 'Mobile number verified successfully',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        mobileNumber: user.mobileNumber,
        role: user.role,
      }
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

    // Verify OTP with Twilio
    const isValidOTP = await verifyTwilioOTP(formattedNumber, otpCode);
    if (!isValidOTP) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    const user = await User.findOne({ mobileNumber: formattedNumber });

    if (!user) {
      throw new AppError('user account was not found. To continue, please create an account', 404);
    }

    const payload = {
      id: user._id.toString(),
      role: user.role,
    };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '20d' });

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


//  * Email Registration with OTP Verification

export const registerWithEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fullName, country, email, mobileNumber, fcmToken, deviceId, deviceType = 'android'  } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }
    if (fcmToken && !deviceId) {
      throw new AppError('deviceId is required when providing fcmToken', 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const user = await User.create({ fullName,country, email,mobileNumber, isVerified: false });


    await OTPVerification.deleteMany({ email });


    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    console.log("🔹 Generated OTP (Plain):", otpCode);

    
    const otpVerification = await OTPVerification.create({
      userId: user._id,
      email,
      otpCode, 
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

        // Store FCM token only if both fcmToken and deviceId are provided
        if (fcmToken && deviceId) {
          // Check if this device token already exists
          const existingToken = await DeviceToken.findOne({
            userId: user._id,
            deviceId: deviceId
          });
    
          if (existingToken) {
            // Update existing token
            existingToken.fcmToken = fcmToken;
            existingToken.deviceType = deviceType;
            await existingToken.save();
            console.log(`Updated FCM token for user ${user._id}, device ${deviceId}`);
          } else {
            // Create new device token
            await DeviceToken.create({
              userId: user._id,
              fcmToken,
              deviceId,
              deviceType
            });
            console.log(`Created new FCM token for user ${user._id}, device ${deviceId}`);
          }
        }
    
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
    const { email, otpCode,fcmToken, deviceId, deviceType = 'android'} = req.body;
    console.log("🔹 User Entered OTP:", otpCode);

    if (!email || !otpCode) {
      throw new AppError('Email and OTP code are required', 400);
    }
    if (fcmToken && !deviceId) {
      throw new AppError('deviceId is required when providing fcmToken', 400);
    }
    // Fetch the latest OTP entry for the email
    const verification = await OTPVerification.findOne({
      email,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 }).lean(); 

    console.log("🔹 Retrieved Verification Data:", verification);

    if (!verification) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    console.log("🔹 Stored OTP from DB:", verification.otpCode);

    if (otpCode !== verification.otpCode) {
      throw new AppError('Invalid OTP', 400);
    }

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
    if (fcmToken && deviceId) {
      const existingToken = await DeviceToken.findOne({
        userId: user._id,
        deviceId: deviceId
      });

      if (existingToken) {                                                                                                                               
        existingToken.fcmToken = fcmToken;
        existingToken.deviceType = deviceType;
        await existingToken.save();
        console.log(`Updated FCM token for user ${user._id}, device ${deviceId}`);
      } else {
        await DeviceToken.create({
          userId: user._id,
          fcmToken,
          deviceId,
          deviceType
        });
        console.log(`Created new FCM token for user ${user._id}, device ${deviceId}`);
      }
    }
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '30d' });

    res.json({ 
      data: {
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        token,
      },
    });
    
  } catch (error) {
    console.error('Verification Error:', error);
    next(error);
  }
};

export const loginWithEmailOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, fcmToken, deviceId, deviceType = 'android' } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    // Check if FCM token and deviceId are provided
    if (fcmToken && !deviceId) {
      throw new AppError('deviceId is required when providing fcmToken', 400);
    }

    const user = await User.findOne({ email });
    if (!user || !user.isVerified) {
      throw new AppError('Invalid credentials or unverified account', 401);
    }

    if (user.isRestricted) {
      throw new AppError('Your profile is restricted. Please contact support team.', 403);
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // OTP Expiry
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    let otp = await OTPVerification.findOne({ userId: user._id, email });

    // Handle OTP logic
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

    // Store FCM token only if both fcmToken and deviceId are provided
    if (fcmToken && deviceId) {
      // Check if this device token already exists
      const existingToken = await DeviceToken.findOne({
        userId: user._id,
        deviceId: deviceId
      });

      if (existingToken) {
        // Update existing token
        existingToken.fcmToken = fcmToken;
        existingToken.deviceType = deviceType;
        await existingToken.save();
        console.log(`Updated FCM token for user ${user._id}, device ${deviceId}`);
      } else {
        // Create new device token
        await DeviceToken.create({
          userId: user._id,
          fcmToken,
          deviceId,
          deviceType
        });
        console.log(`Created new FCM token for user ${user._id}, device ${deviceId}`);
      }
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
    console.error('Error in loginWithEmailOTP:', error);
    next(error);
  }
};
export const verifyLoginOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otpCode, fcmToken, deviceId, deviceType = 'android' } = req.body;

    if (!email || !otpCode) {
      throw new AppError('Email and OTP code are required', 400);
    }

    // Check if FCM token and deviceId are provided
    if (fcmToken && !deviceId) {
      throw new AppError('deviceId is required when providing fcmToken', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('user account was not found. To continue, please create an account', 404);
    }

    const otp = await OTPVerification.findOne({
      userId: user._id,
      email,
      otpCode,
      expiresAt: { $gt: new Date() },
    });

    if (!otp) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '20d' }
    );

    // Handle FCM token registration/update here as well
    // This ensures token is registered even if user skips login step
    if (fcmToken && deviceId) {
      // Check if this device token already exists
      const existingToken = await DeviceToken.findOne({
        userId: user._id,
        deviceId: deviceId
      });

      if (existingToken) {
        // Update existing token
        existingToken.fcmToken = fcmToken;
        existingToken.deviceType = deviceType;
        await existingToken.save();
        console.log(`Updated FCM token for user ${user._id}, device ${deviceId} during OTP verification`);
      } else {
        // Create new device token
        await DeviceToken.create({
          userId: user._id,
          fcmToken,
          deviceId,
          deviceType
        });
        console.log(`Created new FCM token for user ${user._id}, device ${deviceId} during OTP verification`);
      }
    }

    // Delete the OTP document after successful verification
    await OTPVerification.deleteOne({ _id: otp._id });

    // Return user info along with the token
    res.json({
      status: 'success',
      message: 'OTP verified successfully',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          // Include other non-sensitive user fields as needed
        },
        token,
      },
    });
  } catch (error) {
    console.error('Error in verifyOTP:', error);
    next(error);
  }
};

export const googleLoginOrRegister = async (req: Request, res: Response) => {
  try {
    const { idToken, fcmToken, mobileNumber} = req.body;

    if (!idToken) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Google ID token is required',
      });
    }

    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Invalid Google token payload',
      });
    }

    const {
      sub: googleId,
      email_verified: emailVerified,
      name: fullName,
      email,
    } = payload;

    if (!googleId || !emailVerified) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Google ID or email not verified',
      });
    }

    // Check if user exists based on googleId or email (to prevent duplicates)
    let user = await User.findOne({ email }).select('name email isSubscribed role fcmToken');

    const isNewUser = !user;

    // If the user doesn't exist, create a new user
    if (!user) {
      user = await User.create({
        googleId,
        fullName: fullName || '',
        email: email || '',
        mobileNumber: mobileNumber,
        isVerified: true,
        isRestricted: false,
        role: 'sender',
        fcmToken: fcmToken || '',
      });
    } else {
      // If the user exists, update fcmToken, fullName, and email
      user.fcmToken = fcmToken || user.fcmToken;
      user.isVerified = true;

      if (!user.fullName && fullName) user.fullName = fullName;
      if (!user.email && email) user.email = email;

      // Save the updated user data
      await user.save();
    }

    // Generate JWT token
    const payloadJwt = {
      id: user._id.toString(),
      role: user.role,
    };

    const token = jwt.sign(payloadJwt, config.jwtSecret, { expiresIn: '20d' });

    const responseUser = {
      id: user._id,
      googleId: user.googleId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    };

    const responseData = {
      status: 'success',
      message: isNewUser
        ? 'User registered successfully with Google.'
        : 'User logged in successfully with Google.',
      data: {
        token,
        user: responseUser,
      },
    };

    return res
      .status(isNewUser ? StatusCodes.CREATED : StatusCodes.OK)
      .json(responseData);
  } catch (error: any) {
    console.error('Google login error:', error.message || error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Email already exists, please use a different email.',
      });
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Google authentication failed',
    });
  }
};
