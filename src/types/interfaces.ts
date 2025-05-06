import { ObjectId } from 'mongoose';
import { UserRole, DeliveryType, DeliveryStatus, SenderType } from './enums'; // ✅ Correct import

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface DeliveryTimes {
  [DeliveryType.TRUCK]: { totalTime: number, count: number };
  [DeliveryType.CAR]: { totalTime: number, count: number };
  [DeliveryType.BICYCLE]: { totalTime: number, count: number };
  [DeliveryType.BIKE]: { totalTime: number, count: number };
  [DeliveryType.PERSON]: { totalTime: number, count: number };
  [DeliveryType.TAXI]: { totalTime: number, count: number };
  [DeliveryType.AIRPLANE]: { totalTime: number, count: number };
}


export interface IUser {
    id: string;
    role: UserRole;
    username: string;
    phoneNumber: string;
    email: string;
    isVerified: boolean;
    freeDeliveries: number;
    tripsCompleted: number;
    tripsPerDay: number;
    monthlyEarnings: number;
    totalAmountSpent: number;
    totalSentParcels: number;
    totalReceivedParcels: number;
    isRestricted: boolean;
    notifications: string;
    review: string;
    adminFeedback?: string;
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