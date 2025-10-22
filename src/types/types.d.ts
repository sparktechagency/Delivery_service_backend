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

