// import mongoose from "mongoose";

// const deviceTokenSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     fcmToken: { type: String, required: true },
//     deviceName: { type: String, required: false }, 
//     createdAt: { type: Date, default: Date.now },
//   });
  
//   const DeviceToken = mongoose.model('DeviceToken', deviceTokenSchema);
//   export default DeviceToken;
import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceToken extends Document {
  userId: mongoose.Types.ObjectId;
  fcmToken: string;
  deviceType: string;
  deviceId: string;
  createdAt: Date;
  updatedAt: Date;
}

const deviceTokenSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fcmToken: {
      type: String,
      required: true,
      trim: true,
    },
    deviceType: {
      type: String,
      enum: ['ios', 'android', 'web'],
      default: 'android',
    },
    deviceId: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add unique compound index to prevent duplicate devices for a user
deviceTokenSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

// Add index for faster lookups
deviceTokenSchema.index({ fcmToken: 1 });

const DeviceToken = mongoose.model<IDeviceToken>('DeviceToken', deviceTokenSchema);

export default DeviceToken;