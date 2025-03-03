import mongoose from "mongoose";

// Subscription Model
const subscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    type: { type: String, enum: ['basic', 'premium'], required: true },
    freeParcels: { type: Number, default: 3 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  export const Subscription = mongoose.model('Subscription', subscriptionSchema);
  