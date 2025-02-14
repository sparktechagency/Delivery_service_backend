// src/types.d.ts

import { User } from '../types/interfaces';  // Correct import
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: User;  // Add the `user` property to the Request interface
    }
  }
}
