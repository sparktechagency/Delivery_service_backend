
// import { PhoneNumber } from "libphonenumber-js";
// import mongoose from "mongoose";

// const notificationSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
//   message: { type: String, required: true },
//   type: { 
//     type: String, 
//     enum: ['send_parcel', 'Recciver' , 'sender', 'general', 'announcement','parcel_assignment','Accepted','Rejected','Cancelled','Requested-Delivery'], 
//     required: true 
//   },
//   title: { type: String }, 
//   PhoneNumber: { 
//     type: String,
//     default: '',
//   },
//   mobileNumber: {
//     type: String,
//     default: '',
//   },
//   image: {
//     type: String,
//     default: '',
//   },
//   price: {
//     type: Number,
//     default: 0,
//   },
//   description: { type: String },
//   isRead: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now }
// });


// export const Notification = mongoose.model('Notification', notificationSchema);

import mongoose from "mongoose";
export interface NotificationData {
  phoneNumber?: string;
  mobileNumber?: string;
  price?: number;
  description?: string;
  image?: string;
  parcelId?: string;
  pickupLocation?: { latitude: number; longitude: number };  
  deliveryLocation?: { latitude: number; longitude: number };
}


const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['send_parcel', 'Recciver', 'sender', 'general', 'announcement', 'parcel_assignment', 'Accepted', 'Rejected', 'Cancelled', 'Requested-Delivery'],
    required: true
  },
  title: { type: String },
  phoneNumber: { 
    type: String, 
    default: '' 
  },
  mobileNumber: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    default: 0,
  },
 
  pickupLocation: {
    type: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    required: false
  },
  deliveryLocation: {
    type: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    required: false
  },
  description: { type: String },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Notification = mongoose.model('Notification', notificationSchema);
