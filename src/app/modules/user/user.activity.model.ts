import mongoose, { Schema, Document, Model, Types } from 'mongoose';

interface UserActivityDocument extends Document {
  userId: Types.ObjectId;
  loginTime: Date;
  logoutTime: Date;
  timeSpent: number;  // Time spent in minutes
  activityDate: Date;  // Date of activity
}

const userActivitySchema = new Schema<UserActivityDocument>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  loginTime: { type: Date, required: true },
  logoutTime: { type: Date },
  timeSpent: { type: Number, default: 0 },
  activityDate: { type: Date, default: Date.now },
});

export const UserActivity: Model<UserActivityDocument> = mongoose.model<UserActivityDocument>('UserActivity', userActivitySchema);
