// // models/ParcelRequest.ts

// const parcelRequestSchema = new mongoose.Schema({
//   senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   pickupLocation: { type: String, required: true },
//   deliveryLocation: { type: String, required: true },
//   deliveryType: { type: String, enum: Object.values(DeliveryType), required: true },
//   senderType: { type: String, enum: Object.values(SenderType), required: true },
//   status: { type: String, enum: Object.values(DeliveryStatus), default: DeliveryStatus.PENDING },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });


import mongoose from 'mongoose';
import { DeliveryType, DeliveryStatus, SenderType } from '../../../types/enums';





const parcelRequestSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Types.ObjectId, ref: 'User', required: false }, // ✅ Add this field
  pickupLocation: { type: String, required: true },
  deliveryLocation: { type: String, required: true },
  deliveryStartTime:{type: String, required: true },
  deliveryEndTime: {type: String, required: true },
  deliveryType: { type: String, enum: Object.values(DeliveryType), required: true },
  senderType: { type: String, enum: Object.values(SenderType), required: true },
  price: { type: Number, required: true },
  name: String,  // Add name field
  phoneNumber: String, 
  images: [String],
  status: { type: String, enum: Object.values(DeliveryStatus), default: DeliveryStatus.PENDING },
  deliveryRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedDelivererId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' } // Reference to Delivery
});

export const ParcelRequest = mongoose.model('ParcelRequest', parcelRequestSchema);
