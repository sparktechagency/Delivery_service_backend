import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    delivererId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pickupLocation: { type: String, required: true },
    deliveryLocation: { type: String, required: true },
    price: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
  });
  
  export const Delivery = mongoose.model('Delivery', deliverySchema);
  