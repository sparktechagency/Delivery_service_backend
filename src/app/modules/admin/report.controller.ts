// import { Request, Response, NextFunction } from 'express';
// import { User } from '../user/user.model'; // Assuming the User model is located here
// import { ParcelRequest } from '../parcel/ParcelRequest.model'; // Assuming the ParcelRequest model is located here
// import { Order } from '../parcel/order.model'; // Assuming the Order model is located here
// import { UserSubscription } from '../subscriptions/subscription.model'; // Assuming the Subscription model is located here

// // Helper function to get the date range
// const getDateRange = (period: string) => {
//   const now = new Date();
//   let startDate: Date;
  
//   switch (period) {
//     case 'day':
//       startDate = new Date(now.setDate(now.getDate() - 1));
//       break;
//     case 'week':
//       startDate = new Date(now.setDate(now.getDate() - 7));
//       break;
//     case 'month':
//       startDate = new Date(now.setMonth(now.getMonth() - 1));
//       break;
//     case 'year':
//       startDate = new Date(now.setFullYear(now.getFullYear() - 1));
//       break;
//     default:
//       startDate = new Date(now.setDate(now.getDate() - 1)); // Default to day if unknown
//   }
  
//   return startDate;
// };

// // Main controller function
// export const getFilteredSummary = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { period } = req.query; // Get the period from the query parameters (day, week, month, year)
//     const startDate = getDateRange(period as string);

//     // Calculate total revenue for the given period
//     const totalRevenue = await Order.aggregate([
//       { $match: { date: { $gte: startDate } } },
//       { $group: { _id: null, totalRevenue: { $sum: '$bill' } } }
//     ]);

//     // Total Users in the given period
//     const totalUsers = await User.countDocuments({ startDate: { $gte: startDate } });

//     // New Users in the given period
//     const newUsers = await User.countDocuments({ createdAt: { $gte: startDate } });

//     // Total Subscribers in the given period
//     const totalSubscribers = await User.countDocuments({ isSubscribed: true });

//     // New Subscribers in the given period
//     const newSubscribers = await User.countDocuments({
//       isSubscribed: true,
//       subscriptionStartDate: { $gte: startDate }
//     });

//     // Total Orders in the given period
//     const totalOrders = await Order.countDocuments({ date: { $gte: startDate } });

//     // Total Completed Orders in the given period
//     const totalCompletedOrders = await Order.countDocuments({
//       status: 'delivered',
//       date: { $gte: startDate }
//     });

//     // Total Revenue from Subscriptions
//     const totalSubscriptionRevenue = await UserSubscription.aggregate([
//       { $match: { expiryDate: { $gte: startDate } } },
//       { $group: { _id: null, totalRevenue: { $sum: '$price' } } }
//     ]);

//     res.status(200).json({
//       status: 'success',
//       message: 'all summary fetched successfully',
//       data: {
//         totalRevenue: totalRevenue[0]?.totalRevenue || 0,
//         totalSubscriptionRevenue: totalSubscriptionRevenue[0]?.totalRevenue || 0,
//         totalUsers,
//         newUsers,
//         totalSubscribers,
//         newSubscribers,
//         totalOrders,
//         totalCompletedOrders,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };


import { Request, Response, NextFunction } from 'express';
import { User } from '../user/user.model'; // Assuming the User model is located here
import { ParcelRequest } from '../parcel/ParcelRequest.model'; // Assuming the ParcelRequest model is located here
import { Order } from '../parcel/order.model'; // Assuming the Order model is located here
import { UserSubscription } from '../subscriptions/subscription.model'; // Assuming the Subscription model is located here

// Helper function to get the date range
const getDateRange = (period: string) => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'day':
      startDate = new Date(now.setDate(now.getDate() - 1)); // 1 day back
      endDate = new Date(); // Today's date
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7)); // 7 days back
      endDate = new Date(); // Today's date
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1)); // 1 month back
      endDate = new Date(); // Today's date
      break;
    case 'year':
      // Set to the beginning of the previous year (Jan 1st)
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      startDate.setMonth(0, 1); // Set to Jan 1st
      startDate.setHours(0, 0, 0, 0); // Set time to 00:00
      endDate = new Date(now.setFullYear(now.getFullYear() - 1));
      endDate.setMonth(11, 31); // Set to Dec 31st
      endDate.setHours(23, 59, 59, 999); // Set time to 23:59:59
      break;
    default:
      startDate = new Date(now.setDate(now.getDate() - 1)); // Default to 1 day if unknown
      endDate = new Date();
  }

  return { startDate, endDate };
};

// Main controller function
export const getFilteredSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period } = req.query; // Get the period from the query parameters (day, week, month, year)
    const { startDate, endDate } = getDateRange(period as string);


    const totalRevenue = await Order.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, totalRevenue: { $sum: '$bill' } } }
    ]);


    const totalUsers = await User.countDocuments({ startDate: { $gte: startDate, $lte: endDate } });


    const newUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });


    const totalSubscribers = await User.countDocuments({ isSubscribed: true });

    const newSubscribers = await User.countDocuments({
      isSubscribed: true,
      subscriptionStartDate: { $gte: startDate, $lte: endDate }
    });

    const totalOrders = await Order.countDocuments({ date: { $gte: startDate, $lte: endDate } });

    const totalCompletedOrders = await Order.countDocuments({
      status: 'delivered',
      date: { $gte: startDate, $lte: endDate }
    });


    const totalSubscriptionRevenue = await UserSubscription.aggregate([
      { $match: { expiryDate: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, totalRevenue: { $sum: '$price' } } }
    ]);

    res.status(200).json({
      status: 'success',
      message: 'All summary fetched successfully',
      data: {
        totalRevenue: totalRevenue[0]?.totalRevenue || 0,
        totalSubscriptionRevenue: totalSubscriptionRevenue[0]?.totalRevenue || 0,
        totalUsers,
        newUsers,
        totalSubscribers,
        newSubscribers,
        totalOrders,
        totalCompletedOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};
