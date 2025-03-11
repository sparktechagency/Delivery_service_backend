import mongoose from "mongoose";

// Report Model
const reportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    complaint: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  });
  
  export const Report = mongoose.model('Report', reportSchema);
  