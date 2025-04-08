import mongoose, { Schema, Document } from 'mongoose';

export interface GlobalTrialDocument extends Document {
  trialPeriod: number; 
  trialActive: boolean; 
  trialStartDate: Date; 
}

const globalTrialSchema = new Schema({
  trialPeriod: { type: Number, required: true, default: 30 },
  trialActive: { type: Boolean, required: true, default: true }, 
  trialStartDate: { type: Date, required: true, default: Date.now }, 
}, { timestamps: true });

const GlobalTrial = mongoose.models.GlobalTrial || mongoose.model<GlobalTrialDocument>('GlobalTrial', globalTrialSchema);

export { GlobalTrial };
