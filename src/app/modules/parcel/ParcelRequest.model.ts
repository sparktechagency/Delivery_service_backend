
import mongoose, { Schema, Document, Types, ObjectId } from 'mongoose';
import { DeliveryStatus, DeliveryType, SenderType } from '../../../types/enums';


const parcelRequestSchema = new Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Types.ObjectId, ref: 'User', required: false },
  description: { type: String, required: false, default: "" },
  
  // Updated pickupLocation to store coordinates in GeoJSON format
  pickupLocation: {
    type: { type: String, default: 'Point' },
    coordinates: {
      type: [Number],
      required: true,
    },
  },

  deliveryLocation: {
    type: { type: String, default: 'Point' }, 
    coordinates: {
      type: [Number], 
      required: true,
    },
  },

  title: { type: String, required: true },
  deliveryStartTime: { type: Date, required: true },
  deliveryEndTime: { type: Date, required: true },
  deliveryType: { type: String, enum: Object.values(DeliveryType), required: true },
  senderType: { type: String, enum: Object.values(SenderType), required: true },
  price: { type: Number, required: true },
  name: { type: String },
  phoneNumber: { type: String , required: true},
  images:{ type: [String], required: false },
  status: { type: String, enum: Object.values(DeliveryStatus), default: DeliveryStatus.PENDING },
  deliveryRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedDelivererId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' }
});



export const ParcelRequest = mongoose.model('ParcelRequest', parcelRequestSchema);
export type ParcelRequestDocument = Document & {
   _id: string | ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  description: { type: string; required: false; default: string; };
  pickupLocation: { type: string; coordinates: [number, number] };
  deliveryLocation: { type: string; coordinates: [number, number] };
  title: string;
  deliveryStartTime: Date;
  deliveryEndTime: Date;
  deliveryType: string;
  senderType: string;
  price: number;
  images: string[];
  PhoneNumber: string;
  status: string;
  assignedDelivererId: Types.ObjectId;
  deliveryRequests: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};


interface UserLite {
  _id: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  averageRating?: number | string;
  image?: string;
  role?: string;
}

interface ParcelPopulated {
  senderId: UserLite;
  assignedDelivererId: UserLite;
  deliveryRequests: UserLite[];
  createdAt: Date;
  [key: string]: any;
}
parcelRequestSchema.index({ pickupLocation: '2dsphere' });
parcelRequestSchema.index({ deliveryLocation: '2dsphere' });