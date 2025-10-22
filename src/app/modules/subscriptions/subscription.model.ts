
import mongoose, { Schema, Document } from 'mongoose';
import { SubscriptionType } from '../../../types/enums';

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
  trialActive: boolean; 
  trialPeriod: number; 
  expiryDate: Date;
  subscriptionStartDate: Date; 
  subscriptionEndDate: Date; 
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
  trialActive: boolean;
  trialPeriod: number; 
  expiryDate: Date;
  subscriptionStartDate: Date; 
  subscriptionEndDate: Date; 
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
  trialActive: { type: Boolean, default: true }, 
  trialPeriod: { type: Number, default: 60 }, 
  subscriptionStartDate: { type: Date, default: Date.now },
  subscriptionEndDate: { type: Date }, 
  deliveryLimit: { type: Number, default: 0 },
  expiryDate: {
    type: Date,
    default: () => new Date(new Date().setMonth(new Date().getMonth() + 1)),
  }
}, { timestamps: true });

const BaseSubscription = mongoose.models.Subscription ||
  mongoose.model<BaseSubscription>('Subscription', baseSchema);

const GlobalSubscription = BaseSubscription.discriminator<GlobalSubscriptionDocument>(
  'GlobalSubscription',
  new Schema({
    isGlobalPlan: { type: Boolean, default: true }, 
    trialPeriod: { type: Number, default: 30 }, 
    trialActive: { type: Boolean, default: true }, 
  }, { _id: false })
);

const UserSubscription = BaseSubscription.discriminator<UserSubscriptionDocument>(
  'UserSubscription',
  new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isGlobalPlan: { type: Boolean, default: false },
    usesubscriptionstartdate: { type: Date, default: Date.now }, 
    subscriptionEndDate: { type: Date }, 
  }, { _id: false })
);

export { BaseSubscription, GlobalSubscription, UserSubscription };
