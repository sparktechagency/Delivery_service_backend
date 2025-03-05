// // OTPVerification.ts model 
// import mongoose from 'mongoose';

// const otpVerificationSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   mobileNumber: {
//     type: String,
//     required: true
//   },
//   otpCode: {
//     type: String,
//     required: true
//   },
//   expiresAt: {
//     type: Date,
//     required: true
//   }
// }, {
//   timestamps: true
// });

// export const OTPVerification = mongoose.model('OTPVerification', otpVerificationSchema);

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const otpVerificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mobileNumber: { type: String, sparse: true }, // ✅ Allow either mobile or email
  email: { type: String, sparse: true },
  otpCode: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });



export const OTPVerification = mongoose.model('OTPVerification', otpVerificationSchema);

