
// import mongoose, { Schema, Document, Model } from 'mongoose';
// import { SubscriptionType } from '../../../types/enums';

// // ✅ Ensure BaseSubscription does NOT include `userId`
// interface BaseSubscription extends Document {
//   type: SubscriptionType;
//   freeDeliveries: number;
//   totalDeliveries: number;
//   price: number;
//   earnings: number;
//   isActive: boolean;
//   isTrial: boolean;
//   expiryDate: Date;
//   kind?: string; // Discriminator key
// }

// // ✅ Global Subscription Plan (NO `userId`)
// export interface GlobalSubscriptionDocument extends BaseSubscription {
//   isGlobalPlan: boolean;
// }

// // ✅ User Subscription Plan (ONLY `UserSubscription` should have `userId`)
// export interface UserSubscriptionDocument extends BaseSubscription {
//   userId: mongoose.Types.ObjectId;
//   isGlobalPlan: boolean;
// }

// // ✅ Create Base Schema (NO `userId` in BaseSubscription)
// const baseSchema = new Schema<BaseSubscription>(
//   {
//     type: { 
//       type: String, 
//       enum: Object.values(SubscriptionType), // ✅ Ensure enum is properly defined
//       required: true,
//       // lowercase: true
//     },
//     freeDeliveries: { type: Number, default: 3 },
//     totalDeliveries: { type: Number, default: 0 },
//     price: { type: Number, required: true },
//     earnings: { type: Number, default: 0 },
//     isActive: { type: Boolean, default: true },
//     isTrial: { type: Boolean, default: false },
//     expiryDate: { 
//       type: Date, 
//       default: () => new Date(new Date().setMonth(new Date().getMonth() + 1)) 
//     }
//   }, 
//   { 
//     timestamps: true, 
//     discriminatorKey: 'kind' 
//   }
// );

// // ✅ Create the base model (NO `userId` requirement)
// const BaseSubscription = mongoose.models.Subscription || 
//   mongoose.model<BaseSubscription>('Subscription', baseSchema);

// // ✅ Create Global Subscription (DO NOT require `userId`)
// const GlobalSubscription = BaseSubscription.discriminator<GlobalSubscriptionDocument>(
//   'GlobalSubscription',
//   new Schema(
//     {
//       isGlobalPlan: { type: Boolean, default: true }
//     },
//     { _id: false } 
//   )
// );

// // ✅ Create User Subscription (ONLY `userId` required)
// const UserSubscription = BaseSubscription.discriminator<UserSubscriptionDocument>(
//   'UserSubscription',
//   new Schema(
//     {
//       userId: { type: Schema.Types.ObjectId, ref: 'User', required: false }, // ✅ `userId` only required here
//       isGlobalPlan: { type: Boolean, default: false }
//     },
//     { _id: false }
//   )
// );


  

// export { BaseSubscription, GlobalSubscription, UserSubscription };


import mongoose, { Schema, Document, Model } from 'mongoose';
import { SubscriptionType } from '../../../types/enums';

// Base subscription interface (NO `userId` in BaseSubscription)
interface BaseSubscription extends Document {
  type: SubscriptionType;
  freeDeliveries: number;
  description: string;
  totalDeliveries: number;
  price: number;
  earnings: number;
  isActive: boolean;
  isTrial: boolean;
  expiryDate: Date;
  kind?: string; // Discriminator key
}

// Global Subscription (DOES NOT require `userId`)
export interface GlobalSubscriptionDocument extends BaseSubscription {
  isGlobalPlan: boolean;
}

// User Subscription (ONLY `UserSubscription` should have `userId`)
export interface UserSubscriptionDocument extends BaseSubscription {
  userId: mongoose.Types.ObjectId;
  isGlobalPlan: boolean;
}

// Create the base schema (without `userId` in BaseSubscription)
const baseSchema = new Schema<BaseSubscription>(
  {
    type: {
      type: String,
      enum: Object.values(SubscriptionType), // Ensure enum is properly defined
      required: true,
    },
    freeDeliveries: { type: Number, default: 3 },
    description: { type: String, required: true }, 
    totalDeliveries: { type: Number, default: 0 },
    price: { type: Number, required: true },
    earnings: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isTrial: { type: Boolean, default: false },
    expiryDate: {
      type: Date,
      default: () => new Date(new Date().setMonth(new Date().getMonth() + 1)), // Default to 1 month
    },
  },
  { timestamps: true, discriminatorKey: 'kind' } // Add `discriminatorKey`
);

// Base model, without `userId` required
const BaseSubscription = mongoose.models.Subscription ||
  mongoose.model<BaseSubscription>('Subscription', baseSchema);

// Global Subscription: No `userId` required
const GlobalSubscription = BaseSubscription.discriminator<GlobalSubscriptionDocument>(
  'GlobalSubscription',
  new Schema({
    isGlobalPlan: { type: Boolean, default: true }, // Identify Global Plan
  }, { _id: false })
);

// User Subscription: Requires `userId`
const UserSubscription = BaseSubscription.discriminator<UserSubscriptionDocument>(
  'UserSubscription',
  new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Only in UserSubscription
    isGlobalPlan: { type: Boolean, default: false },
  }, { _id: false })
);

export { BaseSubscription, GlobalSubscription, UserSubscription };
