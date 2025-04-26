import mongoose from 'mongoose';
import { UserRole } from '../../../types/enums';

const adminSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  dob: { type: Date },
  permanentAddress: { type: String },
  postalCode: { type: String },
  username: { type: String, unique: true, required: true },
   profileImage: { type: String },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.ADMIN },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Admin = mongoose.model('Admin', adminSchema);
