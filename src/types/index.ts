export enum UserRole {
    SENDER = 'sender',
    DELIVERER = 'deliverer',
    ADMIN = 'admin',
     USER = 'user'
  }
  
  export enum DeliveryType {
    TRUCK = 'truck',
    CAR = 'car',
    BIKE = 'bike',
    BICYCLE = 'bicycle',
    PERSON = 'person'
  }
  
  export enum DeliveryStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    IN_TRANSIT = 'in_transit',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled'
  }
  
  export interface Location {
    latitude: number;
    longitude: number;
    address: string;
  }
  
  // export enum UserRole {
  //   SENDER = 'sender',
  //   DELIVERER = 'deliverer',
  //   ADMIN = 'admin',
  //    // ✅ Add this if "USER" is needed
  // }
  