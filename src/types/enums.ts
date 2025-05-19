export enum UserRole {
    SENDER = 'sender',
    DELIVERER = 'DELIVERER',
    ADMIN = 'ADMIN',
    RECCIVER = "RECCIVER",
    recciver = "recciver"
  }
  
  export enum DeliveryType {
    TRUCK = 'truck',
    CAR = 'car',
    BICYCLE = 'bicycle',
    BIKE = 'bike',
    PERSON = 'person',
    TAXI = 'taxi',
    AIRPLANE = "Plane"
  }
  
  export enum DeliveryStatus {
    PENDING = 'PENDING',
    REQUESTED = 'REQUESTED',
    IN_TRANSIT = 'IN_TRANSIT',
    DELIVERED = 'DELIVERED',
    WAITING = "WAITING",
    // WAITING = "WAITING"
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