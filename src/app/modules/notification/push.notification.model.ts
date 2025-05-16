import mongoose, { Schema, Document } from 'mongoose';

interface IPushNotification extends Document {
  userId: string;
  fcmToken: string;
  title: string;
  body: string;
  data: Record<string, string>;
  sentAt: Date;
}

const pushNotificationSchema = new Schema<IPushNotification>({
  userId: { type: String, required: true },
  fcmToken: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: Map, of: String, default: {} },
  sentAt: { type: Date, default: Date.now },
});

const PushNotification = mongoose.model<IPushNotification>('PushNotification', pushNotificationSchema);

export default PushNotification;
