// import { Request, Response, NextFunction } from 'express';
// import { SubscriptionType } from '../../../types/enums';  // Subscription types
// import { User } from '../user/user.model';  // User model to get subscription info
// import { AppError } from '../../middlewares/error';

// export const getSubscriptionRevenue = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { timeFrame } = req.query; // Get the time frame for revenue report (week, month, year)

//     // Validate time frame
//     if (!['week', 'month', 'year'].includes(timeFrame as string)) {
//       throw new AppError('Invalid time frame', 400);
//     }

//     let startDate: Date;
//     let endDate: Date;

//     // Assign start and end date based on time frame
//     if (timeFrame === 'week') {
//       // Calculate the start date of the current week (Sunday)
//       startDate = new Date();
//       startDate.setDate(startDate.getDate() - startDate.getDay()); // Get the Sunday of the current week
//       endDate = new Date(startDate);
//       endDate.setDate(startDate.getDate() + 6); // Saturday of the same week
//     } else if (timeFrame === 'month') {
//       // For month, just get the first day of the current month
//       startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
//       endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0); // Last day of the current month
//     } else if (timeFrame === 'year') {
//       // For year, get the first day of the current year
//       startDate = new Date(new Date().getFullYear(), 0, 1); // January 1st of current year
//       endDate = new Date(new Date().getFullYear() + 1, 0, 0); // December 31st of current year
//     } else {
//       throw new AppError('Invalid time frame', 400);
//     }

//     console.log('Start Date:', startDate);
//     console.log('End Date:', endDate);

//     // Query for users who have active subscriptions within the given time frame
//     const users = await User.find({
//       subscriptionStartDate: { $gte: startDate },
//       subscriptionExpiryDate: { $lte: endDate },
//       isSubscribed: true,  // Ensure the user is subscribed
//       subscriptionType: { $in: [SubscriptionType.BASIC, SubscriptionType.PREMIUM, SubscriptionType.ENTERPRISE] }  // Ensure active subscription
//     });

//     // Calculate the total subscription revenue for users in the given time frame
//     const totalRevenue = users.reduce((sum, user) => {
//       return sum + user.subscriptionPrice;  // Add the subscription price for each user
//     }, 0);

//     res.status(200).json({
//       status: 'success',
//       message: 'Revenue calculated successfully',
//       data: {
//         timeFrame,
//         totalRevenue
//       }
//     });

//   } catch (error) {
//     next(error);  // Pass error to the error-handling middleware
//   }
// };


import { Request, Response, NextFunction } from 'express';
import { SubscriptionType } from '../../../types/enums';  // Subscription types
import { User } from '../user/user.model';  // User model to get subscription info
import { AppError } from '../../middlewares/error';

export const getSubscriptionRevenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { timeFrame } = req.query; // Get the time frame for revenue report (week, month, year)

    // Validate time frame
    if (!['week', 'month', 'year'].includes(timeFrame as string)) {
      throw new AppError('Invalid time frame', 400);
    }

    // Initialize with default values
    let startDate: Date = new Date();
    let endDate: Date = new Date(); // Current date as end date

    // Assign start date based on time frame
    if (timeFrame === 'week') {
      // Calculate the start date of the current week (Sunday)
      startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Get the Sunday of the current week
    } else if (timeFrame === 'month') {
      // For month, just get the first day of the current month
      startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    } else if (timeFrame === 'year') {
      // For year, get the first day of the current year
      startDate = new Date(new Date().getFullYear(), 0, 1); // January 1st of current year
    }

    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    // Query for users who have active subscriptions within the given time frame
    const users = await User.find({
      isSubscribed: true,  // Ensure the user is subscribed
      subscriptionPrice: { $gt: 0 },  // Ensure subscription price is greater than 0
      subscriptionType: { $in: [SubscriptionType.BASIC, SubscriptionType.PREMIUM, SubscriptionType.ENTERPRISE] },
      $and: [
        { subscriptionStartDate: { $lte: endDate } },  // Subscription started before or on the end date
        { subscriptionExpiryDate: { $gte: startDate } }  // Subscription expires after or on the start date
      ]
    });

    // Debugging: Log the filtered users count
    console.log("📊 Filtered Users Count:", users.length);

    // Calculate the total subscription revenue for users in the given time frame
    const totalRevenue = users.reduce((sum, user) => {
      return sum + user.subscriptionPrice;  // Add the subscription price for each user
    }, 0);

    // Debugging: Log the total revenue
    console.log("📈 Total Revenue:", totalRevenue);

    res.status(200).json({
      status: 'success',
      message: 'Revenue calculated successfully',
      data: {
        timeFrame,
        totalRevenue,
        userCount: users.length
      }
    });

  } catch (error) {
    next(error);  // Pass error to the error-handling middleware
  }
};
