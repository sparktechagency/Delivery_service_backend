// src/types.d.ts

import { IUser } from '../types/interfaces';  // Correct import
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;  // Add the `user` property to the Request interface
    }
  }
}
