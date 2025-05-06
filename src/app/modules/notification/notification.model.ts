
import { PhoneNumber } from "libphonenumber-js";
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['send_parcel', 'Recciver', 'general', 'announcement','parcel_assignment','Accepted','Rejected','Cancelled','Requested-Delivery'], 
    required: true 
  },
  title: { type: String }, 
  PhoneNumber: { 
    type: String,
    default: '',
  },
  mobileNumber: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    default: '',
  },
  description: { type: String },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});


export const Notification = mongoose.model('Notification', notificationSchema);

