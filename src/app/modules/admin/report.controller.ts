
// import { Request, Response, NextFunction } from 'express';
// import { User } from '../user/user.model'; // Assuming the User model is located here
// import { ParcelRequest } from '../parcel/ParcelRequest.model'; // Assuming the ParcelRequest model is located here
// import { Order } from '../parcel/order.model'; // Assuming the Order model is located here
// import { UserSubscription } from '../subscriptions/subscription.model'; // Assuming the Subscription model is located here

// // Helper function to get the date range for exact year/month/day filtering
// const getDateRange = (year?: number, month?: number, day?: number) => {
//   const now = new Date();
//   let startDate: Date;
//   let endDate: Date;

//   if (year && month && day) {
//     // Specific date: year, month, day
//     startDate = new Date(year, month - 1, day, 0, 0, 0, 0); // Month is 0-based in JavaScript
//     endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
//   } else if (year && month) {
//     // Specific month of a specific year
//     startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
//     endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month
//   } else if (year) {
//     // Specific year
//     startDate = new Date(year, 0, 1, 0, 0, 0, 0); // Jan 1st of the year
//     endDate = new Date(year, 11, 31, 23, 59, 59, 999); // Dec 31st of the year
//   } else {
//     // Default to today
//     startDate = new Date(now.setDate(now.getDate() - 1)); // 1 day back
//     endDate = new Date(); // Today's date
//   }

//   return { startDate, endDate };
// };

// // Main controller function
// export const getFilteredSummary = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { year, month, day } = req.query; // Get the year, month, and day from the query parameters
    
//     // Parse the values to numbers, ensuring they are valid
//     const parsedYear = year ? parseInt(year as string, 10) : undefined;
//     const parsedMonth = month ? parseInt(month as string, 10) : undefined;
//     const parsedDay = day ? parseInt(day as string, 10) : undefined;

//     // Get the date range based on provided year, month, and day
//     const { startDate, endDate } = getDateRange(parsedYear, parsedMonth, parsedDay);

//     const totalRevenue = await Order.aggregate([
//       { $match: { date: { $gte: startDate, $lte: endDate } } },
//       { $group: { _id: null, totalRevenue: { $sum: '$bill' } } }
//     ]);

//     const totalUsers = await User.countDocuments({ startDate: { $gte: startDate, $lte: endDate } });

//     const newUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });

//     const totalSubscribers = await User.countDocuments({ isSubscribed: true });

//     const newSubscribers = await User.countDocuments({
//       isSubscribed: true,
//       subscriptionStartDate: { $gte: startDate, $lte: endDate }
//     });

//     const totalOrders = await Order.countDocuments({ date: { $gte: startDate, $lte: endDate } });

//     const totalCompletedOrders = await Order.countDocuments({
//       status: 'delivered',
//       date: { $gte: startDate, $lte: endDate }
//     });

//     const totalSubscriptionRevenue = await UserSubscription.aggregate([
//       { $match: { expiryDate: { $gte: startDate, $lte: endDate } } },
//       { $group: { _id: null, totalRevenue: { $sum: '$price' } } }
//     ]);

//     res.status(200).json({
//       status: 'success',
//       message: 'All summary fetched successfully',
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
import { Order } from '../parcel/order.model'; // Assuming the Order model is located here
import { UserSubscription } from '../subscriptions/subscription.model'; // Assuming the Subscription model is located here
import { User } from '../user/user.model'; // Assuming the User model is located here

// Helper function to get the date range for exact year/month/day filtering
// const getDateRange = (year?: number, month?: number, day?: number) => {
//   const now = new Date();
//   let startDate: Date;
//   let endDate: Date;

//   if (year && month && day) {
//     // Specific date: year, month, day
//     startDate = new Date(year, month - 1, day, 0, 0, 0, 0); // Month is 0-based in JavaScript
//     endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
//   } else if (year && month) {
//     // Specific month of a specific year
//     startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
//     endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month
//   } else if (year) {
//     // Specific year
//     startDate = new Date(year, 0, 1, 0, 0, 0, 0); // Jan 1st of the year
//     endDate = new Date(year, 11, 31, 23, 59, 59, 999); // Dec 31st of the year
//   } else {
//     // Default to today
//     startDate = new Date(now.setDate(now.getDate() - 1)); // 1 day back
//     endDate = new Date(); // Today's date
//   }

//   return { startDate, endDate };
// };

const getDateRange = (year?: number, month?: number, day?: number) => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  if (year && month && day) {
    // Specific date: year, month, day
    startDate = new Date(year, month - 1, day, 0, 0, 0, 0); // Month is 0-based in JavaScript
    endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
  } else if (year && month) {
    // Specific month of a specific year
    startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month
  } else if (year) {
    // Specific year
    startDate = new Date(year, 0, 1, 0, 0, 0, 0); // Jan 1st of the year
    endDate = new Date(year, 11, 31, 23, 59, 59, 999); // Dec 31st of the year
  } else {
    // Default to today
    startDate = new Date(now.setDate(now.getDate() - 1)); // 1 day back
    endDate = new Date(); // Today's date
  }

  return { startDate, endDate };
};

// Helper function to parse query parameters to number
const parseQueryParamToNumber = (param: string | undefined): number | undefined => {
  if (param && typeof param === 'string') {
    return parseInt(param, 10);
  }
  return undefined;
};
// Controller: Total Revenue API

export const getTotalRevenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseQueryParamToNumber(req.query.year as string);
    const month = parseQueryParamToNumber(req.query.month as string);
    const day = parseQueryParamToNumber(req.query.day as string);

    const { startDate, endDate } = getDateRange(year, month, day);

    // If a specific day is selected, return data for that day
    if (year && month && day) {
      const totalRevenue = await Order.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, totalRevenue: { $sum: '$bill' } } }
      ]);
      return res.status(200).json({
        status: 'success',
        data: {
          totalRevenue: totalRevenue[0]?.totalRevenue || 0,
        },
      });
    }

    // If only a month is selected, return data for all days of that month
    if (year && month) {
      const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
      const dataByDay = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const { startDate, endDate } = getDateRange(year, month, day);
        const totalRevenue = await Order.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, totalRevenue: { $sum: '$bill' } } }
        ]);
        dataByDay.push({
          day,
          totalRevenue: totalRevenue[0]?.totalRevenue || 0,
        });
      }
      return res.status(200).json({
        status: 'success',
        data: dataByDay,
      });
    }

    // If only the year is selected, return data for all months of the year
    if (year) {
      const dataByMonth = [];
      for (let month = 1; month <= 12; month++) {
        const { startDate, endDate } = getDateRange(year, month);
        const totalRevenue = await Order.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, totalRevenue: { $sum: '$bill' } } }
        ]);
        dataByMonth.push({
          month,
          totalRevenue: totalRevenue[0]?.totalRevenue || 0,
        });
      }
      return res.status(200).json({
        status: 'success',
        data: dataByMonth,
      });
    }

    // Default: Return data for today
    const totalRevenue = await Order.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, totalRevenue: { $sum: '$bill' } } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalRevenue: totalRevenue[0]?.totalRevenue || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// export const getTotalRevenue = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const year = parseQueryParamToNumber(req.query.year as string);
//     const month = parseQueryParamToNumber(req.query.month as string);
//     const day = parseQueryParamToNumber(req.query.day as string);

//     const { startDate, endDate } = getDateRange(year, month, day);

//     const totalRevenue = await Order.aggregate([
//       { $match: { date: { $gte: startDate, $lte: endDate } } },
//       { $group: { _id: null, totalRevenue: { $sum: '$bill' } } }
//     ]);

//     res.status(200).json({
//       status: 'success',
//       data: {
//         totalRevenue: totalRevenue[0]?.totalRevenue || 0,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };



// Controller: Total Subscription Revenue API
export const getTotalSubscriptionRevenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseQueryParamToNumber(req.query.year as string);
    const month = parseQueryParamToNumber(req.query.month as string);
    const day = parseQueryParamToNumber(req.query.day as string);

    const { startDate, endDate } = getDateRange(year, month, day);

    const totalSubscriptionRevenue = await UserSubscription.aggregate([
      { $match: { expiryDate: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, totalRevenue: { $sum: '$price' } } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalSubscriptionRevenue: totalSubscriptionRevenue[0]?.totalRevenue || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Controller: Total Users API
// export const getTotalUsers = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const year = parseQueryParamToNumber(req.query.year as string);
//     const month = parseQueryParamToNumber(req.query.month as string);
//     const day = parseQueryParamToNumber(req.query.day as string);

//     const { startDate, endDate } = getDateRange(year, month, day);

//     const totalUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });

//     res.status(200).json({
//       status: 'success',
//       data: {
//         totalUsers,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const getTotalUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Parse the year, month, and day from query params
    const year = parseQueryParamToNumber(req.query.year as string);
    const month = parseQueryParamToNumber(req.query.month as string);
    const day = parseQueryParamToNumber(req.query.day as string);

    // Get the appropriate date range based on the year, month, and day
    const { startDate, endDate } = getDateRange(year, month, day);

    // If year and month are selected, aggregate data for all months in the year
    if (year && !month) {
      const dataByMonth = [];
      for (let month = 1; month <= 12; month++) {
        const { startDate, endDate } = getDateRange(year, month);
        const totalUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
        dataByMonth.push({
          month,
          totalUsers,
        });
      }
      return res.status(200).json({
        status: 'success',
        data: dataByMonth,
      });
    }

    // If year and month are selected, aggregate data for all days in the month
    if (year && month && !day) {
      const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
      const dataByDay = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const { startDate, endDate } = getDateRange(year, month, day);
        const totalUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
        dataByDay.push({
          day,
          totalUsers,
        });
      }
      return res.status(200).json({
        status: 'success',
        data: dataByDay,
      });
    }

    // If year, month, and day are all selected, return data for that specific day
    if (year && month && day) {
      const totalUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
      return res.status(200).json({
        status: 'success',
        data: {
          totalUsers,
        },
      });
    }

    // If only the year is selected, show data for that year
    const totalUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};


// Controller: New Users API
// Controller: New Users API
export const getNewUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseQueryParamToNumber(req.query.year as string);
    const month = parseQueryParamToNumber(req.query.month as string);
    const day = parseQueryParamToNumber(req.query.day as string);

    // Get the appropriate date range based on the year, month, and day
    const { startDate, endDate } = getDateRange(year, month, day);

    // If year and month are selected, return data for all months of the year
    if (year && !month) {
      const dataByMonth = [];
      for (let month = 1; month <= 12; month++) {
        const { startDate, endDate } = getDateRange(year, month);
        const newUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
        dataByMonth.push({
          month,
          newUsers,
        });
      }
      return res.status(200).json({
        status: 'success',
        data: dataByMonth,
      });
    }

    // If year and month are selected, return data for all days of that month
    if (year && month && !day) {
      const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
      const dataByDay = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const { startDate, endDate } = getDateRange(year, month, day);
        const newUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
        dataByDay.push({
          day,
          newUsers,
        });
      }
      return res.status(200).json({
        status: 'success',
        data: dataByDay,
      });
    }

    // If year, month, and day are all selected, return data for that specific day
    if (year && month && day) {
      const newUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
      return res.status(200).json({
        status: 'success',
        data: {
          newUsers,
        },
      });
    }

    // Default case: Return new users count for the entire date range (today by default)
    const newUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
    res.status(200).json({
      status: 'success',
      data: {
        newUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};


// Controller: Total Subscribers API
// Controller: Total Subscribers API
export const getTotalSubscribers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseQueryParamToNumber(req.query.year as string);
    const month = parseQueryParamToNumber(req.query.month as string);
    const day = parseQueryParamToNumber(req.query.day as string);

    const { startDate, endDate } = getDateRange(year, month, day);

    const totalSubscribers = await User.countDocuments({ isSubscribed: true });

    res.status(200).json({
      status: 'success',
      data: {
        totalSubscribers,
      },
    });
  } catch (error) {
    next(error);
  }
};


// Controller: New Subscribers API

export const getNewSubscribers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseQueryParamToNumber(req.query.year as string);
    const month = parseQueryParamToNumber(req.query.month as string);
    const day = parseQueryParamToNumber(req.query.day as string);

    const { startDate, endDate } = getDateRange(year, month, day);

    const newSubscribers = await User.countDocuments({
      isSubscribed: true,
      subscriptionStartDate: { $gte: startDate, $lte: endDate }
    });

    res.status(200).json({
      status: 'success',
      data: {
        newSubscribers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Controller: Total Orders API
export const getTotalOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseQueryParamToNumber(req.query.year as string);
    const month = parseQueryParamToNumber(req.query.month as string);
    const day = parseQueryParamToNumber(req.query.day as string);

    const { startDate, endDate } = getDateRange(year, month, day);

    const totalOrders = await Order.countDocuments({ date: { $gte: startDate, $lte: endDate } });

    res.status(200).json({
      status: 'success',
      data: {
        totalOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};



// Controller: Total Completed Orders API
export const getTotalCompletedOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseQueryParamToNumber(req.query.year as string);
    const month = parseQueryParamToNumber(req.query.month as string);
    const day = parseQueryParamToNumber(req.query.day as string);

    const { startDate, endDate } = getDateRange(year, month, day);

    const totalCompletedOrders = await Order.countDocuments({
      status: 'delivered',
      date: { $gte: startDate, $lte: endDate }
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalCompletedOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

