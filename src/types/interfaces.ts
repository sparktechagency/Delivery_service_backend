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
  senderType: SenderType; 
  senderId: ObjectId;     
  receiverId: ObjectId;   
  pickupLocation: string; 
  deliveryLocation: string;
  deliveryType: DeliveryType;
  status: DeliveryStatus; 
  deliveryRequests: ObjectId[];
  assignedDelivererId?: ObjectId; 
  createdAt: Date; 
  updatedAt: Date; 
}