import mongoose from "mongoose";

// Subscription Model
const subscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    type: { type: String, enum: ['Basic', 'Premium', "Enterprise"], required: true },
    freeParcels: { type: Number, default: 3 },
    description:  { type: String, required: false },
    price: { type: Number, required: true },
    expiryDate: {type: Date},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  export const Subscription = mongoose.model('Subscription', subscriptionSchema);
  