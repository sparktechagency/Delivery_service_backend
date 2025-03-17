// src/types.d.ts

import { IUser } from '../types/interfaces';  // Correct import
import { Request } from 'express';

// declare global {
//   namespace Express {
//     interface Request {
//       user?: IUser; 
//       query: {
//         timeFrame?: string;
//       }; // Add the `user` property to the Request interface
//     }
//   }
// }

// In types/express.d.ts (or a similar file)


declare global {
  namespace Express {
    interface Request {
      user?: IUser; 
      query: {
        timeFrame?: string;  // Add other query params here if needed
      };
    }
  }
}
