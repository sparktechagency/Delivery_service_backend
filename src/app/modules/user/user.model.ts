
// import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// import { SenderType, SubscriptionType, UserRole } from '../../../types/enums';

// interface UserDocument extends Document {
//   _id: Types.ObjectId;
//   fullName: string;
//   mobileNumber?: string;
//   email?: string;
//   profileImage: string;
//   passwordHash?: string;
//   facebook: string;
//   instagram: string;
//   whatsapp: string;
//   role: UserRole;
//   isVerified: boolean;
//   senderType?: SenderType;
//   freeDeliveries: number;
//   TotaltripsCompleted: number;
//   totalOrders: number;
//   RecciveOrders: number;
//  SendOrders:[];
//   tripsPerDay: number;
//   monthlyEarnings: number;
//   totalEarning: number;
//   totalAmountSpent: number;
//   totalSentParcels: number;
//   totalReceivedParcels: number;
//   isRestricted: boolean;
//   notifications: string;
//   review: string;
//   adminFeedback?: string;
//   isSubscribed?: boolean;
//   subscriptionType: SubscriptionType; // Added subscription type
//   subscriptionPrice: number; // Added subscription price
//   subscriptionStartDate: Date; // Added subscription start date
//   subscriptionExpiryDate: Date; // Added subscription expiry date
//   subscriptionCount: number; // Added subscription count
//   reviews: { 
//     parcelId: Types.ObjectId; // Reference to the parcel
//     rating: number; // Rating out of 5
//     review: string; // Review text
//   }[];
//   startDate: Date;
//   expiryDate: Date;
// }

// const userSchema = new Schema<UserDocument>({
//   fullName: { type: String, required: true },
//   mobileNumber: { type: String, unique: true, sparse: true },
//   email: { type: String, unique: true, sparse: true },
//   profileImage: { type: String, default: "" },
//   passwordHash: String,
//   facebook: { type: String },
//   instagram: { type: String },
//   whatsapp: { type: String },
//   role: { type: String, enum: Object.values(UserRole), default: UserRole.SENDER },
//   isVerified: { type: Boolean, default: false },
//   senderType: { type: String, enum: Object.values(SenderType) },
//   freeDeliveries: { type: Number, default: 3 }, // Free deliveries field
//   TotaltripsCompleted: { type: Number, default: 0 },
//   totalOrders: { type: Number, default: 0 },
//   RecciveOrders: { type: Number, default: 0 },
//   isSubscribed: { type: Boolean, default: false },
//   isRestricted: { type: Boolean, default: false }, // Restricted field
//   subscriptionType: { type: String, enum: Object.values(SubscriptionType), default: SubscriptionType.BASIC }, // Default subscription
//   subscriptionPrice: { type: Number, default: 0 },
//   subscriptionStartDate: { type: Date, default: Date.now },
//   subscriptionExpiryDate: { type: Date, default: () => new Date(new Date().setMonth(new Date().getMonth() + 1)) },
//   subscriptionCount: { type: Number, default: 0 },
//   SendOrders: [{
//     parcelId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParcelRequest' },
//     pickupLocation: { type: String },
//     deliveryLocation: { type: String },
//     price: { type: Number },
//     title: { type: String },
//     description: { type: String },
//     senderType: { type: String },
//     deliveryType: { type: String },
//     deliveryStartTime: { type: Date },
//     deliveryEndTime: { type: Date },
//   }],
//   reviews: [
//     {
//       parcelId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParcelRequest' },
//       rating: { type: Number, min: 1, max: 5 },
//       review: { type: String },
//     }
//   ],
//   startDate: { type: Date, default: Date.now },
//   expiryDate: { type: Date, default: () => new Date(new Date().setMonth(new Date().getMonth() + 1)) }
// }, { timestamps: true });

// export const User: Model<UserDocument> = mongoose.model<UserDocument>('User', userSchema);


import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { SenderType, SubscriptionType, UserRole } from '../../../types/enums';
import { ParcelRequest, ParcelRequestDocument } from '../parcel/ParcelRequest.model'; 
// interface UserDocument extends Document {
//   _id: Types.ObjectId;
//   fullName: string;
//   mobileNumber?: string;
//   email?: string;
//   profileImage: string;
//   passwordHash?: string;
//   facebook: string;
//   instagram: string;
//   whatsapp: string;
//   role: UserRole;
//   isVerified: boolean;
//   senderType?: SenderType;
//   freeDeliveries: number;
//   TotaltripsCompleted: number;
//   totalOrders: number;
  
//   RecciveOrders: {
//     parcelId: Types.ObjectId;
//     pickupLocation: string;
//     deliveryLocation: string;
//     price: number;
//     title: string;
//     description: string;
//     senderType: SenderType;
//     deliveryType: string;
//     deliveryStartTime: Date;
//     deliveryEndTime: Date;
//   }[];

//   SendOrders: { 
//     parcelId: Types.ObjectId;  // Reference to ParcelRequest
//     pickupLocation: string;
//     deliveryLocation: string;
//     price: number;
//     title: string;
//     description: string;
//     senderType: SenderType;
//     deliveryType: string;
//     deliveryStartTime: Date;
//     deliveryEndTime: Date;
//   }[];  // Modified SendOrders to store an array of objects
//   tripsPerDay: number;
//   monthlyEarnings: number;
//   totalEarning: number;
//   totalAmountSpent: number;
//   totalSentParcels: number;
//   totalReceivedParcels: number;
//   isRestricted: boolean;
//   notifications: string;
//   review: string;
//   adminFeedback?: string;
//   isSubscribed?: boolean;
//   subscriptionType: SubscriptionType; // Added subscription type
//   subscriptionPrice: number; // Added subscription price
//   subscriptionStartDate: Date; // Added subscription start date
//   subscriptionExpiryDate: Date; // Added subscription expiry date
//   subscriptionCount: number; // Added subscription count
//   avgRating?: number;
//   reviews: { 
//     parcelId: Types.ObjectId; // Reference to the parcel
//     rating: number; // Rating out of 5
//     review: string; // Review text
//   }[];
//   activity?: {  // Add this line to temporarily allow the activity field
//     loginTime: string | Date;
//     logoutTime: string | Date;
//     timeSpent: number;
//   };
//   startDate: Date;
//   expiryDate: Date;
// }
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
  totalOrders: number;
  earnings: number;
  totalDelivered: number;  
  

  // Using ParcelRequestDocument as the type for parcelId
  RecciveOrders: Array<{
    parcelId: ParcelRequestDocument; // ParcelRequestDocument is used here
    pickupLocation: string;
    deliveryLocation: string;
    price: number;
    title: string;
    description: string;
    senderType: SenderType;
    deliveryType: string;
    deliveryStartTime: Date;
    deliveryEndTime: Date;
  }>;

  SendOrders: Array<{
    parcelId: ParcelRequestDocument; // ParcelRequestDocument is used here
    pickupLocation: string;
    deliveryLocation: string;
    price: number;
    title: string;
    description: string;
    senderType: SenderType;
    deliveryType: string;
    deliveryStartTime: Date;
    deliveryEndTime: Date;
  }>;

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
  subscriptionType: string;
  subscriptionPrice: number;
  subscriptionStartDate: Date;
  subscriptionExpiryDate: Date;
  subscriptionCount: number;
  isTrial: boolean;
  avgRating?: number;
  reviews: Array<{
    parcelId: Types.ObjectId;
    rating: number;
    review: string;
  }>;
  activity?: {
    loginTime: string | Date;
    logoutTime: string | Date;
    timeSpent: number;
  };
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
  isTrial: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  senderType: { type: String, enum: Object.values(SenderType) },
  freeDeliveries: { type: Number, default: 3 },
  TotaltripsCompleted: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  totalDelivered: { type: Number, default: 0 },
  

  SendOrders: [{
    parcelId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParcelRequest' },
    pickupLocation: { type: String },
    deliveryLocation: { type: String },
    price: { type: Number },
    title: { type: String },
    description: { type: String },
    senderType: { type: String },
    deliveryType: { type: String },
    deliveryStartTime: { type: Date },
    deliveryEndTime: { type: Date },
  }],

  RecciveOrders: [{
    parcelId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParcelRequest' },
    pickupLocation: { type: String },
    deliveryLocation: { type: String },
    price: { type: Number },
    title: { type: String },
    description: { type: String },
    senderType: { type: String },
    deliveryType: { type: String },
    deliveryStartTime: { type: Date },
    deliveryEndTime: { type: Date },
  }],
  
  isSubscribed: { type: Boolean, default: false },
  isRestricted: { type: Boolean, default: false },
  subscriptionType: { type: String, enum: Object.values(SubscriptionType), default: SubscriptionType.BASIC },
  subscriptionPrice: { type: Number, default: 0 },
  subscriptionStartDate: { type: Date, default: Date.now },
  subscriptionExpiryDate: { type: Date, default: () => new Date(new Date().setMonth(new Date().getMonth() + 1)) },
  subscriptionCount: { type: Number, default: 0 },
  reviews: [{
    parcelId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParcelRequest' },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String },
  }],
  startDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, default: () => new Date(new Date().setMonth(new Date().getMonth() + 1)) }
}, { timestamps: true });

export const User: Model<UserDocument> = mongoose.model<UserDocument>('User', userSchema);
