import mongoose from "mongoose";

// Order Model
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  status: { type: String, required: true },
  numberOfItems: { type: Number, required: true },
  deliveryPerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deliveryType: { type: String, required: true },
  senderType: { type: String, required: true },
  date: { type: Date, default: Date.now },
  bill: { type: Number, required: true },
  
  // New fields to track delivery times
  assignedTime: { type: Date }, // Time when the delivery person is assigned
  deliveredTime: { type: Date } // Time when the order is delivered
});

export const Order = mongoose.model('Order', orderSchema);
