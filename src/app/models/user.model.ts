// User.ts model 
// import mongoose from 'mongoose';
// import { UserRole, SenderType } from '../../types/enums';

import mongoose from "mongoose";
import { SenderType, UserRole } from "../../types/enums";

// const userSchema = new mongoose.Schema({
//   fullName: { type: String, required: true },
//   mobileNumber: { type: String, required: true, unique: true },
//   email: { type: String, unique: true, sparse: true },
//   passwordHash: String,
//   role: { type: String, enum: Object.values(UserRole), required: true },
//   isVerified: { type: Boolean, default: false },
//   senderType: { type: String, enum: Object.values(SenderType) },
//   freeDeliveries: { type: Number, default: 3 },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });



// export const User = mongoose.model('User', userSchema);


const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  mobileNumber: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  passwordHash: String,
  socialLinks: [{ type: String }],
  role: { type: String, enum: Object.values(UserRole), default: UserRole.SENDER },
  isVerified: { type: Boolean, default: false },
  senderType: { type: String, enum: Object.values(SenderType) },
  freeDeliveries: { type: Number, default: 3 },
  tripsCompleted: { type: Number, default: 0 },
  tripsPerDay: { type: Number, default: 0 },
  monthlyEarnings: { type: Number, default: 0 },
  totalAmountSpent: { type: Number, default: 0 },
  totalSentParcels: { type: Number, default: 0 },
  totalReceivedParcels: { type: Number, default: 0 }, // ✅ Add this field
  isRestricted: { type: Boolean, default: false },
  adminFeedback: { type: String },
  // other properties
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
