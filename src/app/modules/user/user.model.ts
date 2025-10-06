import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { SenderType, SubscriptionType, UserRole } from '../../../types/enums';
import { ParcelRequest, ParcelRequestDocument } from '../parcel/ParcelRequest.model'; 
import { IUser } from '../../../types/interfaces';

export interface UserDocument extends Document {
   user: IUser;
  _id: Types.ObjectId;
  fullName: string;
  country: string;
  email?: string;
  mobileNumber?: string;
  image: string;
  passwordHash?: string;
  notificationStatus?: boolean;
  facebook: string;
  fcmToken: string;
  googleId: string; 
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
  totalEarning: number;
  monthlyEarnings: number;
  totalAmountSpent: number;
  totalSentParcels: number;
  totalReceivedParcels: number;



  RecciveOrders?: Array<{
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

  SendOrders?: Array<{
    parcelId: ParcelRequestDocument; 
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
  reviews: Array<{
    parcelId: Types.ObjectId;
    rating: number;
    review: string;
  }>;
  avgRating: number;
  activity?: {
    loginTime: string | Date;
    logoutTime: string | Date;
    timeSpent: number;
  };
  startDate: Date;
  expiryDate: Date;
}
const userSchema = new Schema<UserDocument>({
  fullName: { type: String, required: false },
  country: { type: String, required: false },
  email: { 
  type: String, 
  unique: true, 
  sparse: true, 
  required: false 
},
  mobileNumber: { type: String, unique: true, sparse: true },
  image: { type: String, default: 'http://72.167.54.115:3000/uploads/image/130-1759735274003.jpg'},
  passwordHash: String,
  facebook: { type: String },
  instagram: { type: String },
  whatsapp: { type: String },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.SENDER },
  fcmToken: { type: String},
  googleId: { type: String, unique: false, sparse: true, required: false },
  isTrial: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  senderType: { type: String, enum: Object.values(SenderType) },
  freeDeliveries: { type: Number, default: 3 },
  TotaltripsCompleted: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  totalDelivered: { type: Number, default: 0 },
  totalEarning: { type: Number, default: 0 },
  monthlyEarnings: { type: Number, default: 0 },
  totalAmountSpent: { type: Number, default: 0 },
  totalSentParcels: { type: Number, default: 0 },
  totalReceivedParcels: { type: Number, default: 0 },
  notificationStatus: { type: Boolean, default: true },
  

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
    review: { type: String , required: false },
  }],
  avgRating: { type: Number, default: 0 },
  startDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, default: () => new Date(new Date().setMonth(new Date().getMonth() + 1)) }
}, { timestamps: true });

export const User: Model<UserDocument> = mongoose.model<UserDocument>('User', userSchema);
export default User;