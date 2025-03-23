
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
import { ParcelRequest } from '../parcel/ParcelRequest.model';


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

    // If year is selected, return data for each month
    if (year && !month) {
      const dataByMonth = [];
      for (let month = 1; month <= 12; month++) {
        const { startDate, endDate } = getDateRange(year, month);
        const totalRevenue = await Order.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, totalRevenue: { $sum: '$bill' } } }
        ]);
        dataByMonth.push({
          x: month, // Month number (1 to 12)
          y: totalRevenue[0]?.totalRevenue || 0, // Total revenue for that month
        });
      }
      return res.status(200).json({
        status: 'success',
        data: dataByMonth,
      });
    }

    // If year and month are selected, return data for each day of that month
    if (year && month && !day) {
      const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
      const dataByDay = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const { startDate, endDate } = getDateRange(year, month, day);
        const totalRevenue = await Order.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, totalRevenue: { $sum: '$bill' } } }
        ]);
        dataByDay.push({
          x: day, // Day of the month (1, 2, 3, ...)
          y: totalRevenue[0]?.totalRevenue || 0, // Total revenue for that day
        });
      }
      return res.status(200).json({
        status: 'success',
        data: dataByDay,
      });
    }

    // If year, month, and day are all selected, return data for that specific day
    if (year && month && day) {
      const totalRevenue = await Order.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, totalRevenue: { $sum: '$bill' } } }
      ]);
      return res.status(200).json({
        status: 'success',
        data: [
          {
            x: day, // Day of the month (e.g., 15)
            y: totalRevenue[0]?.totalRevenue || 0, // Total revenue for that specific day
          },
        ],
      });
    }

    // Default case: Return total revenue count for the entire date range (today by default)
    const totalRevenue = await Order.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, totalRevenue: { $sum: '$bill' } } }
    ]);

    res.status(200).json({
      status: 'success',
      data: [
        {
          x: new Date().getDate(), // Today's day
          y: totalRevenue[0]?.totalRevenue || 0, // Total revenue for today
        },
      ],
    });
  } catch (error) {
    next(error);
  }
};
export const getTotalSubscriptionRevenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseQueryParamToNumber(req.query.year as string);
    const month = parseQueryParamToNumber(req.query.month as string);
    const day = parseQueryParamToNumber(req.query.day as string);

    const { startDate, endDate } = getDateRange(year, month, day);

    // If year is selected, return data for each month
    if (year && !month) {
      const dataByMonth = [];
      for (let m = 1; m <= 12; m++) {
        const { startDate, endDate } = getDateRange(year, m);
        const totalRevenue = await UserSubscription.aggregate([
          { $match: { expiryDate: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, totalRevenue: { $sum: '$price' } } }
        ]);
        dataByMonth.push({
          x: m, // Month number (1 to 12)
          y: totalRevenue[0]?.totalRevenue || 0, // Total subscription revenue for that month
        });
      }
      return res.status(200).json({
        status: 'success',
        data: dataByMonth,
      });
    }

    // If year and month are selected, return data for each day in the month
    if (year && month && !day) {
      const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
      const dataByDay = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const { startDate, endDate } = getDateRange(year, month, d);
        const totalRevenue = await UserSubscription.aggregate([
          { $match: { expiryDate: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, totalRevenue: { $sum: '$price' } } }
        ]);
        dataByDay.push({
          x: d, // Day of the month (1, 2, 3, ...)
          y: totalRevenue[0]?.totalRevenue || 0, // Total revenue for that day
        });
      }
      return res.status(200).json({
        status: 'success',
        data: dataByDay,
      });
    }

    // If year, month, and day are all selected, return data for that specific day
    if (year && month && day) {
      const totalRevenue = await UserSubscription.aggregate([
        { $match: { expiryDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, totalRevenue: { $sum: '$price' } } }
      ]);
      return res.status(200).json({
        status: 'success',
        data: [
          {
            x: day, // Day of the month (e.g., 15)
            y: totalRevenue[0]?.totalRevenue || 0, // Total subscription revenue for that specific day
          },
        ],
      });
    }

    // Default case: Return total subscription revenue count for the entire date range (today by default)
    const totalRevenue = await UserSubscription.aggregate([
      { $match: { expiryDate: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, totalRevenue: { $sum: '$price' } } }
    ]);
    res.status(200).json({
      status: 'success',
      data: [
        {
          x: new Date().getDate(), // Today's day
          y: totalRevenue[0]?.totalRevenue || 0, // Total subscription revenue for today
        },
      ],
    });
  } catch (error) {
    next(error);
  }
};



export const getTotalUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseQueryParamToNumber(req.query.year as string);
    const month = parseQueryParamToNumber(req.query.month as string);
    const day = parseQueryParamToNumber(req.query.day as string);

    const { startDate, endDate } = getDateRange(year, month, day);

    // If year is selected, return data for each month
    if (year && !month) {
      const dataByMonth = [];
      for (let month = 1; month <= 12; month++) {
        const { startDate, endDate } = getDateRange(year, month);
        const totalUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
        dataByMonth.push({
          x: month, // Month number (1 to 12)
          y: totalUsers, // Total users for that month
        });
      }
      return res.status(200).json({
        status: 'success',
        data: dataByMonth,
      });
    }

    // If year and month are selected, return data for each day of the month
    if (year && month && !day) {
      const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
      const dataByDay = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const { startDate, endDate } = getDateRange(year, month, day);
        const totalUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
        dataByDay.push({
          x: day, // Day of the month (1, 2, 3, ...)
          y: totalUsers, // Total users for that day
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
        data: [
          {
            x: day, // Day of the month (e.g., 15)
            y: totalUsers, // Total users for that specific day
          },
        ],
      });
    }

    // Default case: Return total users count for the entire date range (today by default)
    const totalUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
    return res.status(200).json({
      status: 'success',
      data: [
        {
          x: new Date().getDate(), // Today's day
          y: totalUsers, // Total users for today
        },
      ],
    });
  } catch (error) {
    next(error);
  }
};




// Controller: New Users API
export const getNewUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseQueryParamToNumber(req.query.year as string);
    const month = parseQueryParamToNumber(req.query.month as string);
    const day = parseQueryParamToNumber(req.query.day as string);

    const { startDate, endDate } = getDateRange(year, month, day);

    // If year and month are selected, return data for all months of the year
    if (year && !month) {
      const dataByMonth = [];
      for (let month = 1; month <= 12; month++) {
        const { startDate, endDate } = getDateRange(year, month);
        const newUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
        dataByMonth.push({
          x: month, // Month number (1 to 12)
          y: newUsers, // Total new users for that month
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
          x: day, // Day of the month (1, 2, 3, ...)
          y: newUsers, // Total new users for that day
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
        data: [
          {
            x: day, // Day of the month (e.g., 15)
            y: newUsers, // Total new users for that specific day
          },
        ],
      });
    }

    // Default case: Return new users count for the entire date range (today by default)
    const newUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
    res.status(200).json({
      status: 'success',
      data: [
        {
          x: new Date().getDate(), // Today's day
          y: newUsers, // Total new users for today
        },
      ],
    });
  } catch (error) {
    next(error);
  }
};



// Controller: Total Subscribers API
export const getTotalSubscribers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseQueryParamToNumber(req.query.year as string);
    const month = parseQueryParamToNumber(req.query.month as string);
    const day = parseQueryParamToNumber(req.query.day as string);

    const { startDate, endDate } = getDateRange(year, month, day);

    // If year is selected, return data for each month
    if (year && !month) {
      const dataByMonth = [];
      for (let m = 1; m <= 12; m++) {
        const { startDate, endDate } = getDateRange(year, m);
        const totalSubscribers = await User.countDocuments({ isSubscribed: true, createdAt: { $gte: startDate, $lte: endDate } });
        dataByMonth.push({
          x: m, // Month number (1 to 12)
          y: totalSubscribers || 0, // Total subscribers for that month
        });
      }
      return res.status(200).json({
        status: 'success',
        data: dataByMonth,
      });
    }

    // If year and month are selected, return data for each day of the month
    if (year && month && !day) {
      const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
      const dataByDay = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const { startDate, endDate } = getDateRange(year, month, d);
        const totalSubscribers = await User.countDocuments({ isSubscribed: true, createdAt: { $gte: startDate, $lte: endDate } });
        dataByDay.push({
          x: d, // Day of the month (1, 2, 3, ...)
          y: totalSubscribers || 0, // Total subscribers for that day
        });
      }
      return res.status(200).json({
        status: 'success',
        data: dataByDay,
      });
    }

    // If year, month, and day are all selected, return data for that specific day
    if (year && month && day) {
      const totalSubscribers = await User.countDocuments({ isSubscribed: true, createdAt: { $gte: startDate, $lte: endDate } });
      return res.status(200).json({
        status: 'success',
        data: [
          {
            x: day, // Day of the month (e.g., 15)
            y: totalSubscribers || 0, // Total subscribers for that specific day
          },
        ],
      });
    }

    // Default case: Return total subscribers count for today
    const totalSubscribers = await User.countDocuments({ isSubscribed: true, createdAt: { $gte: startDate, $lte: endDate } });
    return res.status(200).json({
      status: 'success',
      data: [
        {
          x: new Date().getDate(), // Today's day
          y: totalSubscribers || 0, // Total subscribers for today
        },
      ],
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

    // If year is selected, return data for each month
    if (year && !month) {
      const dataByMonth = [];
      for (let m = 1; m <= 12; m++) {
        const { startDate, endDate } = getDateRange(year, m);
        const newSubscribers = await User.countDocuments({
          isSubscribed: true,
          subscriptionStartDate: { $gte: startDate, $lte: endDate }
        });
        dataByMonth.push({
          x: m, // Month number (1 to 12)
          y: newSubscribers || 0, // Total new subscribers for that month
        });
      }
      return res.status(200).json({
        status: 'success',
        data: dataByMonth,
      });
    }

    // If year and month are selected, return data for each day in the month
    if (year && month && !day) {
      const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
      const dataByDay = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const { startDate, endDate } = getDateRange(year, month, d);
        const newSubscribers = await User.countDocuments({
          isSubscribed: true,
          subscriptionStartDate: { $gte: startDate, $lte: endDate }
        });
        dataByDay.push({
          x: d, // Day of the month (1, 2, 3, ...)
          y: newSubscribers || 0, // Total new subscribers for that day
        });
      }
      return res.status(200).json({
        status: 'success',
        data: dataByDay,
      });
    }

    // If year, month, and day are all selected, return data for that specific day
    if (year && month && day) {
      const newSubscribers = await User.countDocuments({
        isSubscribed: true,
        subscriptionStartDate: { $gte: startDate, $lte: endDate }
      });
      return res.status(200).json({
        status: 'success',
        data: [
          {
            x: day, // Day of the month (e.g., 15)
            y: newSubscribers || 0, // Total new subscribers for that specific day
          },
        ],
      });
    }

    // Default case: Return new subscribers count for today
    const newSubscribers = await User.countDocuments({
      isSubscribed: true,
      subscriptionStartDate: { $gte: startDate, $lte: endDate }
    });
    return res.status(200).json({
      status: 'success',
      data: [
        {
          x: new Date().getDate(), // Today's day
          y: newSubscribers || 0, // Total new subscribers for today
        },
      ],
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

    // If year is provided, return data for all 12 months of that year
    if (year && !month) {
      const dataByMonth = [];

      for (let m = 1; m <= 12; m++) {
        const { startDate, endDate } = getDateRange(year, m);
        const totalOrders = await Order.countDocuments({ date: { $gte: startDate, $lte: endDate } });
        dataByMonth.push({
          x: m, // Month number (1 to 12)
          y: totalOrders || 0, // Total orders for that month, or 0 if no data
        });
      }

      return res.status(200).json({
        status: 'success',
        data: dataByMonth,
      });
    }

    // If year and month are provided, return data for each day in the month
    if (year && month && !day) {
      const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
      const dataByDay = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const { startDate, endDate } = getDateRange(year, month, d);
        const totalOrders = await Order.countDocuments({ date: { $gte: startDate, $lte: endDate } });
        dataByDay.push({
          x: d, // Day of the month (1, 2, 3, ...)
          y: totalOrders || 0, // Total orders for that day, or 0 if no data
        });
      }

      return res.status(200).json({
        status: 'success',
        data: dataByDay,
      });
    }

    // If year, month, and day are all selected, return data for that specific day
    if (year && month && day) {
      const totalOrders = await Order.countDocuments({ date: { $gte: startDate, $lte: endDate } });
      return res.status(200).json({
        status: 'success',
        data: [
          {
            x: day, // Day of the month (e.g., 15)
            y: totalOrders || 0, // Total orders for that specific day, or 0 if no data
          },
        ],
      });
    }

    // Default case: Return total orders count for today
    const totalOrders = await Order.countDocuments({ date: { $gte: startDate, $lte: endDate } });
    return res.status(200).json({
      status: 'success',
      data: [
        {
          x: new Date().getDate(), // Today's day
          y: totalOrders || 0, // Total orders for today
        },
      ],
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

    // If year is selected, return data for each month of the year
    if (year && !month) {
      const dataByMonth = [];
      for (let m = 1; m <= 12; m++) {
        const { startDate, endDate } = getDateRange(year, m);
        const totalCompletedOrders = await Order.countDocuments({
          status: 'delivered',
          date: { $gte: startDate, $lte: endDate }
        });
        dataByMonth.push({
          x: m, // Month number (1 to 12)
          y: totalCompletedOrders || 0, // Total completed orders for that month
        });
      }
      return res.status(200).json({
        status: 'success',
        data: dataByMonth,
      });
    }

    // If year and month are selected, return data for each day in that month
    if (year && month && !day) {
      const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
      const dataByDay = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const { startDate, endDate } = getDateRange(year, month, d);
        const totalCompletedOrders = await Order.countDocuments({
          status: 'delivered',
          date: { $gte: startDate, $lte: endDate }
        });
        dataByDay.push({
          x: d, // Day of the month (1, 2, 3, ...)
          y: totalCompletedOrders || 0, // Total completed orders for that day
        });
      }
      return res.status(200).json({
        status: 'success',
        data: dataByDay,
      });
    }

    // If year, month, and day are all selected, return data for that specific day
    if (year && month && day) {
      const totalCompletedOrders = await Order.countDocuments({
        status: 'delivered',
        date: { $gte: startDate, $lte: endDate }
      });
      return res.status(200).json({
        status: 'success',
        data: [
          {
            x: day, // Day of the month (e.g., 15)
            y: totalCompletedOrders || 0, // Total completed orders for that specific day
          },
        ],
      });
    }

    // Default case: Return total completed orders for the entire date range (today by default)
    const totalCompletedOrders = await Order.countDocuments({
      status: 'delivered',
      date: { $gte: startDate, $lte: endDate }
    });

    res.status(200).json({
      status: 'success',
      data: [
        {
          x: new Date().getDate(), // Today's day
          y: totalCompletedOrders || 0, // Total completed orders for today
        },
      ],
    });
  } catch (error) {
    next(error);
  }
};



export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseQueryParamToNumber(req.query.year as string);
    const month = parseQueryParamToNumber(req.query.month as string);
    const day = parseQueryParamToNumber(req.query.day as string);

    const { startDate, endDate } = getDateRange(year, month, day);

    // If year is selected, return data for each month of the year
    if (year && !month) {
      const dataByMonth = [];
      for (let m = 1; m <= 12; m++) {
        const { startDate, endDate } = getDateRange(year, m);
        
        // Total Transactions for the Month
        const totalTransactions = await ParcelRequest.countDocuments({
          status: { $in: ['accepted', 'delivered'] },
          createdAt: { $gte: startDate, $lte: endDate }
        });

        dataByMonth.push({
          x: m, // Month number (1 to 12)
          y: totalTransactions || 0, // Total transactions for that month
        });
      }

      return res.status(200).json({
        status: 'success',
        data: dataByMonth,
      });
    }

    // If year and month are selected, return data for each day of the month
    if (year && month && !day) {
      const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
      const dataByDay = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const { startDate, endDate } = getDateRange(year, month, d);
        
        // Total Transactions for the Day
        const totalTransactions = await ParcelRequest.countDocuments({
          status: { $in: ['accepted', 'delivered'] },
          createdAt: { $gte: startDate, $lte: endDate }
        });

        dataByDay.push({
          x: d, // Day of the month (1, 2, 3, ...)
          y: totalTransactions || 0, // Total transactions for that day
        });
      }

      return res.status(200).json({
        status: 'success',
        data: dataByDay,
      });
    }

    // If year, month, and day are all selected, return data for that specific day
    if (year && month && day) {
      const totalTransactions = await ParcelRequest.countDocuments({
        status: { $in: ['accepted', 'delivered'] },
        createdAt: { $gte: startDate, $lte: endDate }
      });

      return res.status(200).json({
        status: 'success',
        data: [
          {
            x: day, // Day of the month (e.g., 15)
            y: totalTransactions || 0, // Total transactions for that specific day
          },
        ],
      });
    }

    // Default case: Return total transactions count for today
    const totalTransactions = await ParcelRequest.countDocuments({
      status: { $in: ['accepted', 'delivered'] },
      createdAt: { $gte: startDate, $lte: endDate }
    });

    return res.status(200).json({
      status: 'success',
      data: [
        {
          x: new Date().getDate(), // Today's day
          y: totalTransactions || 0, // Total transactions for today
        },
      ],
    });
  } catch (error) {
    next(error);
  }
};

export const getMostUsedDeliveryType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("🔄 getMostUsedDeliveryType called");

    // Aggregate the number of times each deliveryType is used
    const deliveryTypeCounts = await ParcelRequest.aggregate([
      {
        $group: {
          _id: "$deliveryType",  // Group by deliveryType
          count: { $sum: 1 }  // Count the number of occurrences
        }
      },
      {
        $sort: { count: -1 }  // Sort by the count in descending order
      }
    ]);

    // Log the result to verify
    console.log("📊 Delivery type counts:", JSON.stringify(deliveryTypeCounts, null, 2));

    if (deliveryTypeCounts.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No parcel requests found."
      });
    }

    // Get the most used deliveryType (first element after sorting)
    const mostUsedDeliveryType = deliveryTypeCounts[0];

    // Return the response with the counts and the most used type
    res.status(200).json({
      status: "success",
      data: {
        deliveryTypeCounts,
        mostUsedDeliveryType
      }
    });
  } catch (error) {
    console.error("❌ Error in getMostUsedDeliveryType:", error);
    next(error);
  }
};

export const getUserRatingCounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("🔄 getUserRatingCounts called");

    // Aggregate to count the number of users for each rating (1 to 5 stars)
    const ratingCounts = await User.aggregate([
      // Unwind the reviews array to work with individual reviews
      { $unwind: "$reviews" },

      // Group by rating and count the number of occurrences of each rating
      {
        $group: {
          _id: "$reviews.rating", // Group by the rating field
          count: { $sum: 1 } // Count the number of users with that rating
        }
      },

      // Sort the results by rating in descending order
      { $sort: { _id: 1 } }
    ]);

    // Log the results for debugging
    console.log("📊 User rating counts:", JSON.stringify(ratingCounts, null, 2));

    // If no ratings are found, return an empty list or a message
    if (ratingCounts.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No users found with reviews."
      });
    }

    // Send the response with the counts of users for each rating
    const userRatings = {
      "5_star": 0,
      "4_star": 0,
      "3_star": 0,
      "2_star": 0,
      "1_star": 0
    };

    // Populate the user ratings counts based on the aggregation result
    ratingCounts.forEach((ratingCount) => {
      if (ratingCount._id === 5) userRatings["5_star"] = ratingCount.count;
      if (ratingCount._id === 4) userRatings["4_star"] = ratingCount.count;
      if (ratingCount._id === 3) userRatings["3_star"] = ratingCount.count;
      if (ratingCount._id === 2) userRatings["2_star"] = ratingCount.count;
      if (ratingCount._id === 1) userRatings["1_star"] = ratingCount.count;
    });

    // Return the counts of users with each star rating
    res.status(200).json({
      status: "success",
      data: userRatings
    });
  } catch (error) {
    console.error("❌ Error in getUserRatingCounts:", error);
    next(error);
  }
};
