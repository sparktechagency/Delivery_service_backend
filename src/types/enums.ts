export enum UserRole {
    SENDER = 'sender',
    DELIVERER = 'deliverer',
    ADMIN = 'admin',
    recciver = "recciver"
  }
  
  export enum DeliveryType {
    TRUCK = 'truck',
    CAR = 'car',
    BICYCLE = 'bicycle',
    BIKE = 'bike',
    PERSON = 'person',
    Taxi = 'taxi',
    AirPlane = "AirPlane"
  }
  
  export enum DeliveryStatus {
    PENDING = 'PENDING',
    REQUESTED = 'WAITING',
    IN_TRANSIT = 'IN_TRANSIT',
    DELIVERED = 'DELIVERED',
    WAITING = "WAITING"
  }
  
  
  export enum SenderType {
    PROFESSIONAL = 'professional',
    NON_PROFESSIONAL = 'non-professional'
    //  = 'non_professional'
  }
  export enum SubscriptionType {
    BASIC = "Basic",
    PREMIUM = "Premium",
    ENTERPRISE = "Enterprise", 

  }
  
  
  
  export const getSubscriptionTypeValues = (): string[] => {
    return Object.values(SubscriptionType).filter(value => typeof value === 'string');
  };