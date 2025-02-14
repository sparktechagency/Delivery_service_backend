// // models/ParcelRequest.ts
import mongoose from 'mongoose';
import { DeliveryType, DeliveryStatus, SenderType } from '../../types/enums';

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


const parcelRequestSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickupLocation: { type: String, required: true },
  deliveryLocation: { type: String, required: true },
  deliveryType: { type: String, enum: Object.values(DeliveryType), required: true },
  senderType: { type: String, enum: Object.values(SenderType), required: true },
  status: { type: String, enum: Object.values(DeliveryStatus), default: DeliveryStatus.PENDING },
  deliveryRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Track delivery requests
  assignedDelivererId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Track the assigned deliverer
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const ParcelRequest = mongoose.model('ParcelRequest', parcelRequestSchema);
