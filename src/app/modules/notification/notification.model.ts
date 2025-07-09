import mongoose from "mongoose";
import moment from "moment-timezone";
export interface NotificationData {
  userId?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  price?: number;
  description?: string;
  image?: string;
  parcelId?: string;
  uswerId?: string;
  AvgRating?: number;
  deliveryStartTime?: string;
  deliveryEndTime?: string;
  name?: string;
  pickupLocation?: { latitude: number; longitude: number };  
  deliveryLocation?: { latitude: number; longitude: number };
  createdAt?: Date;
  
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
  parcelId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParcelRequest' },
  AvgRating: { type: Number, default: 0 },
  deliveryStartTime: { type: String },
  deliveryEndTime: { type: String },
  name: { type: String },
  description: { type: String },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
    localCreatedAt: { 
    type: String, 
    default: function() {
      return moment().tz('Asia/Dhaka').format('YYYY-MM-DD hh:mm A');
    }
  }
});

export const Notification = mongoose.model('Notification', notificationSchema);
