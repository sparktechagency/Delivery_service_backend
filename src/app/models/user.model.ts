
// import mongoose from "mongoose";
// import { SenderType, UserRole } from "../../types/enums";

// interface UserDocument extends mongoose.Document {
//   // userId: string;
//   fullName: string;   
//   mobileNumber: string;
//   email: string;
//   passwordHash: string;
//   socialLinks: string[];
//   role: UserRole;
//   isVerified: boolean;
//   senderType: SenderType;
//   freeDeliveries: number;
//   tripsCompleted: number;
//   tripsPerDay: number;
//   monthlyEarnings: number;
//   totalAmountSpent: number;
//   totalSentParcels: number;
//   totalReceivedParcels: number;
//   isRestricted: boolean;
//   adminFeedback: string;
// }

// const userSchema = new mongoose.Schema({
//   // userId: { type: String, required: true, unique: true },
//   fullName: { type: String, required: true },
//   mobileNumber: { type: String, unique: true, sparse: true },
//   email: { type: String, unique: true, sparse: true },
//   passwordHash: String,
//   socialLinks: [{ type: String }],
//   role: { type: String, enum: Object.values(UserRole), default: UserRole.SENDER },
//   isVerified: { type: Boolean, default: false },
//   senderType: { type: String, enum: Object.values(SenderType) },
//   freeDeliveries: { type: Number, default: 3 },
//   tripsCompleted: { type: Number, default: 0 },
//   tripsPerDay: { type: Number, default: 0 },
//   monthlyEarnings: { type: Number, default: 0 },
//   totalAmountSpent: { type: Number, default: 0 },
//   totalSentParcels: { type: Number, default: 0 },
//   totalReceivedParcels: { type: Number, default: 0 }, // ✅ Add this field
//   isRestricted: { type: Boolean, default: false },
//   adminFeedback: { type: String },
//   // other properties
// }, { timestamps: true });

// export const User = mongoose.model('User', userSchema);

import mongoose, { Document, Schema, Model, Types } from "mongoose";
import { SenderType, UserRole } from "../../types/enums";

// Define the User Document Type
interface UserDocument extends Document {
  _id: Types.ObjectId; // ✅ Explicitly define _id as an ObjectId
  fullName: string;
  mobileNumber?: string;
  email?: string;
  passwordHash?: string;
  socialLinks: string[];
  role: UserRole;
  isVerified: boolean;
  senderType?: SenderType;
  freeDeliveries: number;
  tripsCompleted: number;
  tripsPerDay: number;
  monthlyEarnings: number;
  totalAmountSpent: number;
  totalSentParcels: number;
  totalReceivedParcels: number;
  isRestricted: boolean;
  adminFeedback?: string;
}

// Define the Mongoose Schema
const userSchema = new Schema<UserDocument>({
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
  totalReceivedParcels: { type: Number, default: 0 },
  isRestricted: { type: Boolean, default: false },
  adminFeedback: { type: String },
}, { timestamps: true });

// Create the User Model with Explicit Type
export const User: Model<UserDocument> = mongoose.model<UserDocument>('User', userSchema);
