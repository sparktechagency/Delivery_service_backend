import { Request, Response } from 'express';
import { UserModel } from '../../models/user.model';
import { OTPService } from '../services/OTPService';
import jwt from 'jsonwebtoken';

const otpService = new OTPService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { username, phoneNumber, role } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findOne({ phoneNumber });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user
      const user = new UserModel({
        username,
        phoneNumber,
        role
      });
      await user.save();

      // Generate and send OTP
      const otp = await otpService.generateOTP(phoneNumber);
      // In production, integrate with SMS service to send OTP
      console.log(`OTP for ${phoneNumber}: ${otp}`);

      res.status(201).json({ message: 'User registered successfully. Please verify OTP.' });
    } catch (error) {
      res.status(500).json({ message: 'Error registering user', error });
    }
  }

  async verifyOTP(req: Request, res: Response) {
    try {
      const { phoneNumber, otp } = req.body;

      const isValid = await otpService.verifyOTP(phoneNumber, otp);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      const user = await UserModel.findOne({ phoneNumber });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.isVerified = true;
      await user.save();

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({ message: 'OTP verified successfully', token });
    } catch (error) {
      res.status(500).json({ message: 'Error verifying OTP', error });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { phoneNumber } = req.body;

      const user = await UserModel.findOne({ phoneNumber });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const otp = await otpService.generateOTP(phoneNumber);
      // In production, integrate with SMS service to send OTP
      console.log(`OTP for ${phoneNumber}: ${otp}`);

      res.json({ message: 'OTP sent successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error logging in', error });
    }
  }
}