// import mongoose from 'mongoose';
// import { UserRole } from '../../types/index';

// const userSchema = new mongoose.Schema({
//   fullName: {
//     type: String,
//     required: true
//   },
//   mobileNumber: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   email: {
//     type: String,
//     unique: true,
//     sparse: true
//   },
//   passwordHash: String,
//   role: {
//     type: String,
//     enum: Object.values(UserRole),
//     required: true
//   },
//   isVerified: {
//     type: Boolean,
//     default: false
//   },
//   isProfessional: {
//     type: Boolean,
//     default: false
//   },
//   deliveryCount: {
//     type: Number,
//     default: 0
//   }
// }, {
//   timestamps: true
// });

// export const User = mongoose.model('User', userSchema);


import mongoose from 'mongoose';
import { UserRole, SenderType } from '../../types/enums';

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  mobileNumber: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  passwordHash: String,
  role: { type: String, enum: Object.values(UserRole), required: true },
  isVerified: { type: Boolean, default: false },
  senderType: { type: String, enum: Object.values(SenderType) },
  freeDeliveries: { type: Number, default: 3 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});



export const User = mongoose.model('User', userSchema);