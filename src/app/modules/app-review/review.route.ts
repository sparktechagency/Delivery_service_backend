import express from 'express';
import { createReview, getReviews, deleteReview } from './review.controller';
import { authenticate, authorize } from '../../middlewares/auth';
import { UserRole } from '../../../types/enums';

const ReviewRoutes = express.Router();

ReviewRoutes.post('/', authenticate, createReview);

ReviewRoutes.get('/',getReviews);

ReviewRoutes.delete('/:reviewId', authenticate,authorize(UserRole.ADMIN), deleteReview);
export default ReviewRoutes;
