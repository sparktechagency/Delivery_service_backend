// // DeliveryRequest.ts model  
// import mongoose from 'mongoose';
// import { DeliveryType, DeliveryStatus } from '../../types/index';

// const locationSchema = new mongoose.Schema({
//   latitude: {
//     type: Number,
//     required: true
//   },
//   longitude: {
//     type: Number,
//     required: true
//   },
//   address: {
//     type: String,
//     required: true
//   }
// });

// const deliveryRequestSchema = new mongoose.Schema({
//   senderId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   title: {
//     type: String,
//     required: true
//   },
//   description: String,
//   pickupLocation: {
//     type: locationSchema,
//     required: true
//   },
//   deliveryLocation: {
//     type: locationSchema,
//     required: true
//   },
//   deliveryTime: {
//     type: Date,
//     required: true
//   },
//   deliveryType: {
//     type: String,
//     enum: Object.values(DeliveryType),
//     required: true
//   },
//   price: {
//     type: Number,
//     required: true
//   },
//   status: {
//     type: String,
//     enum: Object.values(DeliveryStatus),
//     default: DeliveryStatus.PENDING
//   },
//   images: [String]
// }, {
//   timestamps: true
// });

// export const DeliveryRequest = mongoose.model('DeliveryRequest', deliveryRequestSchema);

import mongoose from 'mongoose';
import { DeliveryType, DeliveryStatus } from '../../../types/enums';

const locationSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String, required: true }
});

const deliveryRequestSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  SenderName: { type:  mongoose.Schema.Types.ObjectId, ref: 'User', required: true  },
  title: { type: String, required: true },
  description: String,
  pickupLocation: { type: locationSchema, required: true },
  deliveryLocation: { type: locationSchema, required: true },
  deliveryTime: { type: Date, required: true },
  deliveryType: { type: String, enum: Object.values(DeliveryType), required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: Object.values(DeliveryStatus), default: DeliveryStatus.PENDING },
  images: [String],
  deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' } 
}, { timestamps: true });

export const DeliveryRequest = mongoose.model('DeliveryRequest', deliveryRequestSchema);
