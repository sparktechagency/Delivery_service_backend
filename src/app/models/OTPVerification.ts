import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const otpVerificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mobileNumber: { type: String, sparse: true }, 
  email: { type: String, sparse: true },
  otpCode: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });



export const OTPVerification = mongoose.model('OTPVerification', otpVerificationSchema);

