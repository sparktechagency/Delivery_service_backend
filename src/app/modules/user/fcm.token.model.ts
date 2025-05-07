import mongoose from "mongoose";

const deviceTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fcmToken: { type: String, required: true },
    deviceName: { type: String, required: false }, // Optional: store device name or ID
    createdAt: { type: Date, default: Date.now },
  });
  
  const DeviceToken = mongoose.model('DeviceToken', deviceTokenSchema);
  export default DeviceToken;