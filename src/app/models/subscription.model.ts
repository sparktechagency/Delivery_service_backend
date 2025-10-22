
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

