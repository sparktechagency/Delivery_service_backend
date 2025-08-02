import mongoose, { Schema, Document } from 'mongoose';

interface IAppReview extends Document {
  userId: mongoose.Types.ObjectId; 
  rating: number;  
  reviewText: string; 
  createdAt: Date;  
}

const AppReviewSchema: Schema<IAppReview> = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const AppReview = mongoose.model<IAppReview>('AppReview', AppReviewSchema);

export default AppReview;
