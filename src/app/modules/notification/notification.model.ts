// import mongoose from "mongoose";

// const notificationSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     message: { type: String, required: true },
//     type: { type: String, enum: ['parcel_update', 'delivery_request', 'general'], required: true },
//     isRead: { type: Boolean, default: false },
//     createdAt: { type: Date, default: Date.now }
//   });
  
//   export const Notification = mongoose.model('Notification', notificationSchema);
  

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Make userId optional
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['parcel_update', 'delivery_request', 'general', 'announcement'], 
    required: true 
  },
  title: { type: String }, // Title for announcements
  description: { type: String }, // Description for announcements
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});


export const Notification = mongoose.model('Notification', notificationSchema);
