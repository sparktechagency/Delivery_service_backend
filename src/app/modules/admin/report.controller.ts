

import { NextFunction } from "express";
import { SubscriptionType } from "../../../types/enums";
import { ParcelRequest } from "../parcel/ParcelRequest.model";
import { User } from "../user/user.model";
import { AppError } from "../../middlewares/error";

// export const getSubscriptionRevenue = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { timeFrame } = req.query; // Get the time frame for revenue report (week, month, year)

//     // Validate time frame
//     if (!['week', 'month', 'year'].includes(timeFrame as string)) {
//       throw new AppError('Invalid time frame', 400);
//     }

//     // Initialize with default values
//     let startDate: Date = new Date();
//     let endDate: Date = new Date(); // Current date as end date

//     // Assign start date based on time frame
//     if (timeFrame === 'week') {
//       // Calculate the start date of the current week (Sunday)
//       startDate = new Date();
//       startDate.setDate(startDate.getDate() - startDate.getDay()); // Get the Sunday of the current week
//     } else if (timeFrame === 'month') {
//       // For month, just get the first day of the current month
//       startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
//     } else if (timeFrame === 'year') {
//       // For year, get the first day of the current year
//       startDate = new Date(new Date().getFullYear(), 0, 1); // January 1st of current year
//     }

//     console.log('Start Date:', startDate);
//     console.log('End Date:', endDate);

//     // Query for users who have active subscriptions within the given time frame
//     const users = await User.find({
//       isSubscribed: true,  // Ensure the user is subscribed
//       subscriptionPrice: { $gt: 0 },  // Ensure subscription price is greater than 0
//       subscriptionType: { $in: [SubscriptionType.BASIC, SubscriptionType.PREMIUM, SubscriptionType.ENTERPRISE] },
//       $and: [
//         { subscriptionStartDate: { $lte: endDate } },  // Subscription started before or on the end date
//         { subscriptionExpiryDate: { $gte: startDate } }  // Subscription expires after or on the start date
//       ]
//     });

//     // Debugging: Log the filtered users count
//     console.log("📊 Filtered Users Count:", users.length);

//     // Calculate the total subscription revenue for users in the given time frame
//     const totalRevenue = users.reduce((sum, user) => {
//       return sum + user.subscriptionPrice;  // Add the subscription price for each user
//     }, 0);

//     // Debugging: Log the total revenue
//     console.log("📈 Total Revenue:", totalRevenue);

//     res.status(200).json({
//       status: 'success',
//       message: 'Revenue calculated successfully',
//       data: {
//         timeFrame,
//         totalRevenue,
//         userCount: users.length
//       }
//     });

//   } catch (error) {
//     next(error);  // Pass error to the error-handling middleware
//   }
// };

export const getDashboardSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { timeFrame } = req.query; // Get the time frame for the report (day, week, month, year)

    // Validate time frame
    if (!['day', 'week', 'month', 'year'].includes(timeFrame as string)) {
      throw new Error('Invalid time frame');
    }

    // Initialize start and end dates based on the time frame
    let startDate: Date = new Date();
    let endDate: Date = new Date(); // Current date as end date

    // Calculate start date based on the time frame
    if (timeFrame === 'day') {
      startDate = new Date();
    } else if (timeFrame === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Get the Sunday of the current week
    } else if (timeFrame === 'month') {
      startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1); // First day of the current month
    } else if (timeFrame === 'year') {
      startDate = new Date(new Date().getFullYear(), 0, 1); // January 1st of current year
    }

    // Example data retrieval - replace with actual logic
    const totalUsers = 100; // Placeholder
    const totalSubscribers = 50; // Placeholder
    const totalOrders = 30; // Placeholder
    const totalRevenue = 5000; // Placeholder
    const totalTransactions = 20; // Placeholder

    // Send response with summary data
    res.status(200).json({
      status: 'success',
      message: 'Dashboard summary fetched successfully',
      data: {
        totalUsers,
        totalSubscribers,
        totalOrders,
        totalRevenue,
        totalTransactions,
      },
    });
  } catch (error) {
    next(error); // Pass error to the error-handling middleware
  }
};
