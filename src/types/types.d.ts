
import { IUser } from '../types/interfaces';  // Correct import
import { Request } from 'express';


declare global {
  namespace Express {
    interface Request {
      user?: IUser; 
      query: {
        timeFrame?: string;  
      };
    }
  }
}
