import { NextFunction, Request, RequestHandler, Response } from 'express';

const catchAsync =
  (fn: RequestHandler) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Execute the asynchronous route handler
      await fn(req, res, next);
    } catch (error) {
      // Pass the error to the next middleware for centralized error handling
      console.error('Error caught by catchAsync:', error); // Debugging log
      next(error); 
    }
  };

export default catchAsync;
