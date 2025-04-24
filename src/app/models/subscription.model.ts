// import mongoose from "mongoose";

// const subscriptionSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
//   type: { 
//     type: String, 
//     required: true, 
//     // Removed the enum to allow flexibility for subscription types
//   },
//   freeParcels: { type: Number, default: 3 },
//   description: { type: String, required: false },
//   price: { type: Number, required: true },
//   deliveryLimit: { type: Number, required: true },
//   expiryDate: { type: Date },
//   trialPeriod: { 
//     type: Number, 
//     default: 0, // trial period in days (0 means no trial)
//   },
//   subscriptionStartDate: { type: Date, default: Date.now }, // Start date of the subscription
//   subscriptionEndDate: { type: Date }, // End date of the subscription
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// export const Subscription = mongoose.model('Subscription', subscriptionSchema);
import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  type: { 
    type: String, 
    required: true, 

  },
  freeParcels: { type: Number, default: 3 },
  description: { type: String, required: false },
  price: { type: Number, required: true },
  deliveryLimit: { type: Number, required: true },
  expiryDate: { type: Date },
  trialPeriod: { 
    type: Number, 
    default: 0,
  },
  subscriptionStartDate: { type: Date, default: Date.now }, 
  subscriptionEndDate: { type: Date }, 
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);

export { Subscription };
