import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorHandler = async (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (err instanceof AppError) {
     res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  console.error(err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
};