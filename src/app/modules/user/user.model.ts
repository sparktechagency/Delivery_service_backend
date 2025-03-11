

// import mongoose, { Document, Schema, Model, Types } from "mongoose";
// import { SenderType, UserRole } from "../../../types/enums";

// // Define the User Document Type
// interface UserDocument extends Document {
//   _id: Types.ObjectId; // ✅ Explicitly define _id as an ObjectId
//   fullName: string;
//   mobileNumber?: string;
//   email?: string;
//   profileImage: string;
//   passwordHash?: string;
//   // socialLinks: string[];
//   facebook: string;
//   instagram: string;
//   whatsapp: string
//   role: UserRole;
//   isVerified: boolean;
//   senderType?: SenderType;
//   freeDeliveries: number;
//   TotaltripsCompleted: number;
//   tripsPerDay: number;
//   monthlyEarnings: number;
//   totalEarning: number;
//   totalAmountSpent: number;
//   totalSentParcels: number;
//   totalReceivedParcels: number;
//   isRestricted: boolean;
//   notifications: string;
//   review:string
//   adminFeedback?: string;
//   isSubscribed?: boolean; 
//   startDate: Date;
//   expiryDate: Date;
// }

// // Define the Mongoose Schema
// const userSchema = new Schema<UserDocument>({
//   fullName: { type: String, required: true },
//   mobileNumber: { type: String, unique: true, sparse: true },
//   email: { type: String, unique: true, sparse: true },
//   profileImage: { type: String, default: "" },
//   passwordHash: String,
//   // socialLinks: [{ type: String }],
//   facebook: {type: String,},
//   instagram: {type: String,},
//   whatsapp: {type: String,},
//   role: { type: String, enum: Object.values(UserRole), default: UserRole.SENDER },
//   isVerified: { type: Boolean, default: false },
//   senderType: { type: String, enum: Object.values(SenderType) },
//   freeDeliveries: { type: Number, default: 3 },
//   TotaltripsCompleted: { type: Number, default: 0 },
//   tripsPerDay: { type: Number, default: 0 },
//   monthlyEarnings: { type: Number, default: 0 },
//   totalEarning: { type: Number, default: 0 },
//   totalAmountSpent: { type: Number, default: 0 },
//   totalSentParcels: { type: Number, default: 0 },
//   totalReceivedParcels: { type: Number, default: 0 },
//   isRestricted: { type: Boolean, default: false },
//   notifications: { type: String, required: false },
//   review: {type: String, required: false},
//   adminFeedback: { type: String },
//   isSubscribed: {type: Boolean, default: false },
//   startDate: { type: Date, default: Date.now }, // ✅ Set the start date
//   expiryDate: {
//     type: Date,
//     default: () => new Date(new Date().setMonth(new Date().getMonth() + 1)), // ✅ Expire after 1 month
//   },
// }, { timestamps: true });

// // Create the User Model with Explicit Type
// export const User: Model<UserDocument> = mongoose.model<UserDocument>('User', userSchema);

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { SenderType, SubscriptionType, UserRole } from '../../../types/enums';

interface UserDocument extends Document {
  _id: Types.ObjectId;
  fullName: string;
  mobileNumber?: string;
  email?: string;
  profileImage: string;
  passwordHash?: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
  role: UserRole;
  isVerified: boolean;
  senderType?: SenderType;
  freeDeliveries: number;
  TotaltripsCompleted: number;
  tripsPerDay: number;
  monthlyEarnings: number;
  totalEarning: number;
  totalAmountSpent: number;
  totalSentParcels: number;
  totalReceivedParcels: number;
  isRestricted: boolean;
  notifications: string;
  review: string;
  adminFeedback?: string;
  isSubscribed?: boolean;
  subscriptionType: SubscriptionType; // Added subscription type
  subscriptionPrice: number; // Added subscription price
  subscriptionStartDate: Date; // Added subscription start date
  subscriptionExpiryDate: Date; // Added subscription expiry date
  subscriptionCount: number; // Added subscription count
  startDate: Date;
  expiryDate: Date;
}

const userSchema = new Schema<UserDocument>({
  fullName: { type: String, required: true },
  mobileNumber: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  profileImage: { type: String, default: "" },
  passwordHash: String,
  facebook: { type: String },
  instagram: { type: String },
  whatsapp: { type: String },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.SENDER },
  isVerified: { type: Boolean, default: false },
  senderType: { type: String, enum: Object.values(SenderType) },
  freeDeliveries: { type: Number, default: 3 }, // Free deliveries field
  isSubscribed: { type: Boolean, default: false },
  isRestricted: { type: Boolean, default: false }, // Restricted field
  subscriptionType: { type: String, enum: Object.values(SubscriptionType), default: SubscriptionType.BASIC }, // Default subscription
  subscriptionPrice: { type: Number, default: 0 },
  subscriptionStartDate: { type: Date, default: Date.now },
  subscriptionExpiryDate: { type: Date, default: () => new Date(new Date().setMonth(new Date().getMonth() + 1)) },
  subscriptionCount: { type: Number, default: 0 },
  startDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, default: () => new Date(new Date().setMonth(new Date().getMonth() + 1)) }
}, { timestamps: true });

export const User: Model<UserDocument> = mongoose.model<UserDocument>('User', userSchema);
