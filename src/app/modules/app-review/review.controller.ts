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
    const userRole = req.user?.role;  // Assuming you have user roles (admin, user, etc.)
    
    console.log('User ID:', userId, 'Review ID:', reviewId, 'User Role:', userRole);

    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'User ID is required to delete a review.',
      });
      return;
    }

    if (userRole === 'ADMIN') {
      console.log('Admin user, allowing deletion of any review.');
      // Admin can delete the review without checking ownership
      const review = await AppReview.findById(reviewId);
      if (!review) {
        res.status(404).json({
          status: 'error',
          message: 'Review not found.',
          // console: `Review ID: ${reviewId}, User ID: ${userId}`,
        });
        return;
      }
      
      // Proceed with deleting the review
      await review.deleteOne();
      res.status(200).json({
        status: 'success',
        message: 'Review deleted successfully.',
        console: `Review with ID: ${reviewId} deleted by admin with ID: ${userId}`,
      });
      return;
    }

    // If the user is not an admin, check if they are the owner of the review
    const review = await AppReview.findOne({ _id: reviewId, userId });

    if (!review) {
      res.status(404).json({
        status: 'error',
        message: 'Review not found or you do not have permission to delete it.',
      });
      return;
    }

    // Proceed with deleting the review for non-admin users
    await review.deleteOne();
    res.status(200).json({
      status: 'success',
      message: 'Review deleted successfully.',
      console: `Review with ID: ${reviewId} deleted by user with ID: ${userId}`,
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    next(error);
  }
};

