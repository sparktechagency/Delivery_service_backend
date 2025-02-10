import { UserRole, DeliveryType, DeliveryStatus, SenderType } from './enums'; // ✅ Correct import

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface User {
  id: string;
  username: string;
  phoneNumber: string;
  role: UserRole;
  senderType?: SenderType;
  deliveryType?: DeliveryType[];
  isVerified: boolean;
  freeDeliveries: number;
  createdAt: Date;
  updatedAt: Date;
}
