import mongoose, { Schema } from 'mongoose';
import { UserRole, SenderType, DeliveryType } from '../../types/enums'; // ✅ Import from enums.ts
import { User } from '../../types/interfaces';

const userSchema = new Schema<User>({
  username: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  role: { type: String, enum: Object.values(UserRole), required: true },
  senderType: { type: String, enum: Object.values(SenderType) }, // ✅ Use enum directly
  deliveryType: [{ type: String, enum: Object.values(DeliveryType) }], // ✅ Use enum directly
  isVerified: { type: Boolean, default: false },
  freeDeliveries: { type: Number, default: 3 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.models.User || mongoose.model<User>('User', userSchema); // ✅ Prevent OverwriteModelError
