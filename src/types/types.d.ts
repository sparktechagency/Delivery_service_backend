
// import { IUser } from '../types/interfaces';  // Correct import
// import { Request } from 'express';


// declare global {
//   namespace Express {
//     interface Request {
//       user?: IUser; 
//       query: {
//         timeFrame?: string;  
//       };
//     }
//   }
// }

import { IUser } from '../types/interfaces';
import { ParsedQs } from 'qs';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;  
      query: ParsedQs & { timeFrame?: string }; 
    }
  }
}

