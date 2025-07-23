import mongoose from "mongoose";
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
  
  assignedTime: { type: Date },
  deliveredTime: { type: Date } 
});

export const Order = mongoose.model('Order', orderSchema);
