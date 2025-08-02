import { Request, Response, NextFunction } from 'express';
import AppReview from './review.model';  // Import the AppReview model

// Create a new review (Global review for the app)
export const createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { rating, reviewText } = req.body;
    const userId = req.user?.id;  // Assuming the user is logged in and their ID is in the request

    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'User ID is required for review creation.',
      });
      return;
    }

    // Validate the input
    if (!rating || !reviewText) {
      res.status(400).json({
        status: 'error',
        message: 'Rating and review text are required.',
      });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({
        status: 'error',
        message: 'Rating must be between 1 and 5.',
      });
      return;
    }

    // Create the review
    const review = new AppReview({
      userId,
      rating,
      reviewText,
    });

    await review.save();

    res.status(201).json({
      status: 'success',
      message: 'Review created successfully.',
      data: review,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    next(error);
  }
};

export const getReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {

    const page = parseInt(req.query.page as string) || 1; 
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const reviews = await AppReview.find()
      .skip(skip) 
      .limit(limit)  
      .populate('userId', 'fullName email');

    const totalReviews = await AppReview.countDocuments();

    res.status(200).json({
      status: 'success',
      data: reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews: totalReviews,
        reviewsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    next(error);
  }
};


// Delete a review (only the review creator can delete)
export const deleteReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'User ID is required to delete a review.',
      });
      return;
    }

    // Check if the review exists and if the user is the one who wrote it
    const review = await AppReview.findOne({ _id: reviewId, userId });

    if (!review) {
      res.status(404).json({
        status: 'error',
        message: 'Review not found or you do not have permission to delete it.',
      });
      return;
    }

    // Delete the review
    await review.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Review deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    next(error);
  }
};
