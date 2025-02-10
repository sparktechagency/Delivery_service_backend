export enum UserRole {
    SENDER = 'sender',
    DELIVERER = 'deliverer',
    ADMIN = 'admin'
  }
  
  export enum DeliveryType {
    TRUCK = 'truck',
    CAR = 'car',
    BICYCLE = 'bicycle',
    BIKE = 'bike',
    PERSON = 'person'
  }
  
  export enum DeliveryStatus {
    PENDING = 'pending',
    REQUESTED = 'requested',
    ACCEPTED = 'accepted',
    IN_TRANSIT = 'in_transit',
    DELIVERED = 'delivered'
  }
  
  export enum SenderType {
    PROFESSIONAL = 'professional',
    NON_PROFESSIONAL = 'non_professional'
  }
  