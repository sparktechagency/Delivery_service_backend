import express from 'express';
import { createReview, getReviews, deleteReview } from './review.controller';
import { authenticate } from '../../middlewares/auth';

const ReviewRoutes = express.Router();

ReviewRoutes.post('/', authenticate, createReview);

ReviewRoutes.get('/',getReviews);

ReviewRoutes.delete('/:reviewId', authenticate, deleteReview);
export default ReviewRoutes;
