import { ObjectId } from 'mongoose';
import { UserRole, DeliveryType, DeliveryStatus, SenderType } from './enums'; // ✅ Correct import

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface IUser { // Renamed from User to IUser
  id: string;
  username: string;
  phoneNumber: string;
  email: string;
  role: UserRole;
  senderType?: SenderType;
  deliveryType?: DeliveryType[];
  isVerified: boolean;
  freeDeliveries: number;
  createdAt: Date;
  updatedAt: Date;
}


export interface IDelivery {
  senderType: SenderType; // Sender type (Professional / Non-Professional)
  senderId: ObjectId;     // Reference to the user sending the parcel
  receiverId: ObjectId;   // Reference to the user receiving the parcel
  pickupLocation: string;  // Location from which the parcel will be picked up
  deliveryLocation: string; // Delivery destination
  deliveryType: DeliveryType; // Type of delivery (Truck, Car, etc.)
  status: DeliveryStatus; // Status of the delivery (Pending, Accepted, etc.)
  deliveryRequests: ObjectId[]; // References to delivery request objects
  assignedDelivererId?: ObjectId; // Assigned deliverer if available
  createdAt: Date; // When the delivery was created
  updatedAt: Date; // When the delivery was last updated
}