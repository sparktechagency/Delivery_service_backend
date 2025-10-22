
import mongoose, { Schema, Document } from 'mongoose';
import { SubscriptionType } from '../../../types/enums';

// Base subscription interface (NO `userId` in BaseSubscription)
interface BaseSubscription extends Document {
  type: string; 
  freeDeliveries: number;
  description: string;
  totalDeliveries: number;
  price: number;
  earnings: number;
  isActive: boolean;
  isTrial: boolean;
  trialPeriod: number; 
  trialActive: boolean; 
  expiryDate: Date;
  kind?: string; 
  deliveryLimit: number;
}
export interface GlobalSubscriptionDocument extends Document {
  type: string;
  freeDeliveries: number;
  description: string;
  totalDeliveries: number;
  deliveryLimit: number;
  price: number;
  earnings: number;
  isActive: boolean;
  isTrial: boolean;
  trialActive: boolean; // Flag to mark if the global trial is active
  trialPeriod: number; // Global trial period in days
  expiryDate: Date;
  subscriptionStartDate: Date; // Start date of the subscription
  subscriptionEndDate: Date; // End date of the subscription
}



export interface GlobalSubscriptionDocument extends BaseSubscription {
  type: string;
  freeDeliveries: number;
  description: string;
  totalDeliveries: number;
  price: number;
  earnings: number;
  deliveryLimit: number;
  isActive: boolean;
  isTrial: boolean;
  trialActive: boolean; // Flag to mark if the global trial is active
  trialPeriod: number; // Global trial period in days
  expiryDate: Date;
  subscriptionStartDate: Date; // Start date of the subscription
  subscriptionEndDate: Date; // End date of the subscription
}


export interface UserSubscriptionDocument extends BaseSubscription {
  userId: mongoose.Types.ObjectId;
  isGlobalPlan: boolean;
  subscriptionStartDate: Date; 
  subscriptionExpiryDate: Date;
}


const baseSchema = new Schema({
  type: { 
    type: String, 
    required: true 
  },
  freeDeliveries: { type: Number, default: 3 },
  description: { type: String, required: true },
  totalDeliveries: { type: Number, default: 0 },
  price: { type: Number, required: true },
  earnings: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isTrial: { type: Boolean, default: false },
  trialActive: { type: Boolean, default: true }, // Flag for trial activation
  trialPeriod: { type: Number, default: 60 }, // Default trial period (60 days)
  subscriptionStartDate: { type: Date, default: Date.now }, // Start date of the subscription
  subscriptionEndDate: { type: Date }, // End date of the subscription
  deliveryLimit: { type: Number, default: 0 },
  expiryDate: {
    type: Date,
    default: () => new Date(new Date().setMonth(new Date().getMonth() + 1)),
  }
}, { timestamps: true });

const BaseSubscription = mongoose.models.Subscription ||
  mongoose.model<BaseSubscription>('Subscription', baseSchema);

// Global Subscription: No `userId` required
const GlobalSubscription = BaseSubscription.discriminator<GlobalSubscriptionDocument>(
  'GlobalSubscription',
  new Schema({
    isGlobalPlan: { type: Boolean, default: true }, // Identify Global Plan
    trialPeriod: { type: Number, default: 30 }, // Global trial period in days
    trialActive: { type: Boolean, default: true }, // Flag to activate trial period
  }, { _id: false })
);

// User Subscription: Requires `userId`
const UserSubscription = BaseSubscription.discriminator<UserSubscriptionDocument>(
  'UserSubscription',
  new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Only in UserSubscription
    isGlobalPlan: { type: Boolean, default: false },
    usesubscriptionstartdate: { type: Date, default: Date.now }, // Start date of the subscription
    subscriptionEndDate: { type: Date }, // End date of the subscription
  }, { _id: false })
);

export { BaseSubscription, GlobalSubscription, UserSubscription };
