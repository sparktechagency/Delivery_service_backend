import { Request, Response, NextFunction } from 'express';
import { Order } from '../parcel/order.model'; 
import { UserSubscription } from '../subscriptions/subscription.model';
import { User } from '../user/user.model';
import { ParcelRequest } from '../parcel/ParcelRequest.model';
import { UserActivity } from '../user/user.activity.model';
import moment from 'moment';


const getDateRange = (year?: number, month?: number, day?: number) => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  if (year && month && day) {
    startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
  } else if (year && month) {
    startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    endDate = new Date(year, month, 0, 23, 59, 59, 999); 
  } else if (year) {
    // Specific year
    startDate = new Date(year, 0, 1, 0, 0, 0, 0); 
    endDate = new Date(year, 11, 31, 23, 59, 59, 999);
  } else {
    startDate = new Date(now.setDate(now.getDate() - 1)); 
    endDate = new Date(); 
  }

  return { startDate, endDate };
};

const parseQueryParamToNumber = (param: string | undefined): number | undefined => {
  if (param && typeof param === 'string') {
    return parseInt(param, 10);
  }
  return undefined;
};

export const getTotalRevenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseQueryParamToNumber(req.query.year as string);
    const month = parseQueryParamToNumber(req.query.month as string);
    const day = parseQueryParamToNumber(req.query.day as string);

    const { startDate, endDate } = getDateRange(year, month, day);

    if (year && !month) {
      const dataByMonth = [];
      let totalRevenueSum = 0; 
      for (let month = 1; month <= 12; month++) {
        const { startDate, endDate } = getDateRange(year, month);
        const totalRevenue = await Order.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, totalRevenue: { $sum: '$bill' } } }
        ]);
        const monthRevenue = totalRevenue[0]?.totalRevenue || 0;
        dataByMonth.push({
          x: month,
          y: monthRevenue,
        });
        totalRevenueSum += monthRevenue;
      }
      return res.status(200).json({
        status: 'success',
        data: dataByMonth,
        total: totalRevenueSum,  
      });
    }

    if (year && month && !day) {
      const daysInMonth = new Date(year, month, 0).getDate(); 
      const dataByDay = [];
      let totalRevenueSum = 0;  
      for (let day = 1; day <= daysInMonth; day++) {
        const { startDate, endDate } = getDateRange(year, month, day);
        const totalRevenue = await Order.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, totalRevenue: { $sum: '$bill' } } }
        ]);
        const dayRevenue = totalRevenue[0]?.totalRevenue || 0;
        dataByDay.push({
          x: day, 
          y: dayRevenue, 
        });
        totalRevenueSum += dayRevenue; 
      }
      return res.status(200).json({
        status: 'success',
        data: dataByDay,
        total: totalRevenueSum, 
      });
    }

    if (year && month && day) {
      const totalRevenue = await Order.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, totalRevenue: { $sum: '$bill' } } }
      ]);
      const dayRevenue = totalRevenue[0]?.totalRevenue || 0;
      return res.status(200).json({
        status: 'success',
        data: [
          {
            x: day, 
            y: dayRevenue, 
          },
        ],
        total: dayRevenue, 
      });
    }

    // Default case: Return total revenue count for the entire date range (today by default)
    const totalRevenue = await Order.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, totalRevenue: { $sum: '$bill' } } }
    ]);
    const todayRevenue = totalRevenue[0]?.totalRevenue || 0;
    return res.status(200).json({
      status: 'success',
      data: [
        {
          x: new Date().getDate(), // Today's day
          y: todayRevenue, // Total revenue for today
        },
      ],
      total: todayRevenue,  // Dynamically calculated total
    });
  } catch (error) {
    next(error);
  }
};

export const getTotalRevenueNumber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Total Revenue for the entire database without any date filtering
    const totalRevenue = await Order.aggregate([
      { $match: { /* no date range filter */ } },
      { $group: { _id: null, totalRevenue: { $sum: '$bill' } } }
    ]);

    const totalRevenueSum = totalRevenue[0]?.totalRevenue || 0;  // Ensure there's no undefined value

    return res.status(200).json({
      status: 'success',
      data: [
        {
          x: 'Total', // Label indicating this is the total for the entire database
          y: totalRevenueSum, // Total revenue for the entire database
        },
      ],
      total: totalRevenueSum,  // Dynamically calculated total for the entire database
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



// export const getTotalUsers = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const year = parseQueryParamToNumber(req.query.year as string);
//     const month = parseQueryParamToNumber(req.query.month as string);
//     const day = parseQueryParamToNumber(req.query.day as string);

//     const { startDate, endDate } = getDateRange(year, month, day);

//     // If year is selected, return data for each month
//     if (year && !month) {
//       const dataByMonth = [];
//       for (let month = 1; month <= 12; month++) {
//         const { startDate, endDate } = getDateRange(year, month);
//         const totalUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
//         dataByMonth.push({
//           x: month, // Month number (1 to 12)
//           y: totalUsers, // Total users for that month
//         });
//       }
//       return res.status(200).json({
//         status: 'success',
//         data: dataByMonth,
//       });
//     }

//     // If year and month are selected, return data for each day of the month
//     if (year && month && !day) {
//       const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
//       const dataByDay = [];
//       for (let day = 1; day <= daysInMonth; day++) {
//         const { startDate, endDate } = getDateRange(year, month, day);
//         const totalUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
//         dataByDay.push({
//           x: day, // Day of the month (1, 2, 3, ...)
//           y: totalUsers, // Total users for that day
//         });
//       }
//       return res.status(200).json({
//         status: 'success',
//         data: dataByDay,
//       });
//     }

//     // If year, month, and day are all selected, return data for that specific day
//     if (year && month && day) {
//       const totalUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
//       return res.status(200).json({
//         status: 'success',
//         data: [
//           {
//             x: day, // Day of the month (e.g., 15)
//             y: totalUsers, // Total users for that specific day
//           },
//         ],
//       });
//     }

//     // Default case: Return total users count for the entire date range (today by default)
//     const totalUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
//     return res.status(200).json({
//       status: 'success',
//       data: [
//         {
//           x: new Date().getDate(), // Today's day
//           y: totalUsers, // Total users for today
//         },
//       ],
//     });
//   } catch (error) {
//     next(error);
//   }
// };




// Controller: New Users API

export const getTotalUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseQueryParamToNumber(req.query.year as string);
    const month = parseQueryParamToNumber(req.query.month as string);
    const day = parseQueryParamToNumber(req.query.day as string);

    const { startDate, endDate } = getDateRange(year, month, day);

    // If year is selected, return data for each month
    if (year && !month) {
      const dataByMonth = [];
      let totalUsersSum = 0;  // Variable to store the total users sum
      for (let month = 1; month <= 12; month++) {
        const { startDate, endDate } = getDateRange(year, month);
        const totalUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
        dataByMonth.push({
          x: month, // Month number (1 to 12)
          y: totalUsers, // Total users for that month
        });
        totalUsersSum += totalUsers; // Add to total sum
      }
      return res.status(200).json({
        status: 'success',
        data: dataByMonth,
        total: totalUsersSum,  // Dynamically calculated total
      });
    }

    // If year and month are selected, return data for each day of that month
    if (year && month && !day) {
      const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
      const dataByDay = [];
      let totalUsersSum = 0;  // Variable to store the total users sum
      for (let day = 1; day <= daysInMonth; day++) {
        const { startDate, endDate } = getDateRange(year, month, day);
        const totalUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
        dataByDay.push({
          x: day, // Day of the month (1, 2, 3, ...)
          y: totalUsers, // Total users for that day
        });
        totalUsersSum += totalUsers; // Add to total sum
      }
      return res.status(200).json({
        status: 'success',
        data: dataByDay,
        total: totalUsersSum,  // Dynamically calculated total
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
        total: totalUsers,  // Dynamically calculated total
      });
    }

    // Default case: Return total users count for today
    const totalUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
    return res.status(200).json({
      status: 'success',
      data: [
        {
          x: new Date().getDate(), // Today's day
          y: totalUsers, // Total users for today
        },
      ],
      total: totalUsers,  // Dynamically calculated total
    });
  } catch (error) {
    next(error);
  }
};

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
// export const getTotalSubscribers = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const year = parseQueryParamToNumber(req.query.year as string);
//     const month = parseQueryParamToNumber(req.query.month as string);
//     const day = parseQueryParamToNumber(req.query.day as string);

//     const { startDate, endDate } = getDateRange(year, month, day);

//     // If year is selected, return data for each month
//     if (year && !month) {
//       const dataByMonth = [];
//       for (let m = 1; m <= 12; m++) {
//         const { startDate, endDate } = getDateRange(year, m);
//         const totalSubscribers = await User.countDocuments({ isSubscribed: true, createdAt: { $gte: startDate, $lte: endDate } });
//         dataByMonth.push({
//           x: m, // Month number (1 to 12)
//           y: totalSubscribers || 0, // Total subscribers for that month
//         });
//       }
//       return res.status(200).json({
//         status: 'success',
//         data: dataByMonth,
//       });
//     }

//     // If year and month are selected, return data for each day of the month
//     if (year && month && !day) {
//       const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
//       const dataByDay = [];
//       for (let d = 1; d <= daysInMonth; d++) {
//         const { startDate, endDate } = getDateRange(year, month, d);
//         const totalSubscribers = await User.countDocuments({ isSubscribed: true, createdAt: { $gte: startDate, $lte: endDate } });
//         dataByDay.push({
//           x: d, // Day of the month (1, 2, 3, ...)
//           y: totalSubscribers || 0, // Total subscribers for that day
//         });
//       }
//       return res.status(200).json({
//         status: 'success',
//         data: dataByDay,
//       });
//     }

//     // If year, month, and day are all selected, return data for that specific day
//     if (year && month && day) {
//       const totalSubscribers = await User.countDocuments({ isSubscribed: true, createdAt: { $gte: startDate, $lte: endDate } });
//       return res.status(200).json({
//         status: 'success',
//         data: [
//           {
//             x: day, // Day of the month (e.g., 15)
//             y: totalSubscribers || 0, // Total subscribers for that specific day
//           },
//         ],
//       });
//     }

//     // Default case: Return total subscribers count for today
//     const totalSubscribers = await User.countDocuments({ isSubscribed: true, createdAt: { $gte: startDate, $lte: endDate } });
//     return res.status(200).json({
//       status: 'success',
//       data: [
//         {
//           x: new Date().getDate(), // Today's day
//           y: totalSubscribers || 0, // Total subscribers for today
//         },
//       ],
//     });
//   } catch (error) {
//     next(error);
//   }
// };
export const getTotalSubscribers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseQueryParamToNumber(req.query.year as string);
    const month = parseQueryParamToNumber(req.query.month as string);
    const day = parseQueryParamToNumber(req.query.day as string);

    const { startDate, endDate } = getDateRange(year, month, day);

    // If year is selected, return data for each month
    if (year && !month) {
      const dataByMonth = [];
      let totalSubscribersSum = 0;  // Variable to store the total subscribers sum
      for (let m = 1; m <= 12; m++) {
        const { startDate, endDate } = getDateRange(year, m);
        const totalSubscribers = await User.countDocuments({ isSubscribed: true, createdAt: { $gte: startDate, $lte: endDate } });
        dataByMonth.push({
          x: m, // Month number (1 to 12)
          y: totalSubscribers || 0, // Total subscribers for that month
        });
        totalSubscribersSum += totalSubscribers || 0; // Add to total sum
      }
      return res.status(200).json({
        status: 'success',
        data: dataByMonth,
        total: totalSubscribersSum,  // Dynamically calculated total
      });
    }

    // If year and month are selected, return data for each day of the month
    if (year && month && !day) {
      const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
      const dataByDay = [];
      let totalSubscribersSum = 0;  // Variable to store the total subscribers sum
      for (let d = 1; d <= daysInMonth; d++) {
        const { startDate, endDate } = getDateRange(year, month, d);
        const totalSubscribers = await User.countDocuments({ isSubscribed: true, createdAt: { $gte: startDate, $lte: endDate } });
        dataByDay.push({
          x: d, // Day of the month (1, 2, 3, ...)
          y: totalSubscribers || 0, // Total subscribers for that day
        });
        totalSubscribersSum += totalSubscribers || 0; // Add to total sum
      }
      return res.status(200).json({
        status: 'success',
        data: dataByDay,
        total: totalSubscribersSum,  // Dynamically calculated total
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
        total: totalSubscribers || 0,  // Dynamically calculated total
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
      total: totalSubscribers || 0,  // Dynamically calculated total
    });
  } catch (error) {
    next(error);
  }
};
export const getTotalSubscribersNumber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Total Subscribers for the entire database where 'isSubscribed' is true
    const totalSubscribers = await User.countDocuments({ isSubscribed: true });

    return res.status(200).json({
      status: 'success',
      data: [
        {
          x: 'Total', // Label indicating this is the total for the entire database
          y: totalSubscribers || 0, // Total subscribers for the entire database
        },
      ],
      total: totalSubscribers || 0,  // Dynamically calculated total for all subscribers in the database
    });
  } catch (error) {
    next(error);
  }
};


export const getNewSubscribers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseQueryParamToNumber(req.query.year as string);
    const month = parseQueryParamToNumber(req.query.month as string);
    const day = parseQueryParamToNumber(req.query.day as string);

    const { startDate, endDate } = getDateRange(year, month, day);

    if (year && !month) {
      const dataByMonth = [];
      for (let m = 1; m <= 12; m++) {
        const { startDate, endDate } = getDateRange(year, m);
        const newSubscribers = await User.countDocuments({
          isSubscribed: true,
          subscriptionStartDate: { $gte: startDate, $lte: endDate }
        });
        dataByMonth.push({
          x: m, 
          y: newSubscribers || 0, 
        });
      }
      return res.status(200).json({
        status: 'success',
        data: dataByMonth,
      });
    }

    if (year && month && !day) {
      const daysInMonth = new Date(year, month, 0).getDate();
      const dataByDay = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const { startDate, endDate } = getDateRange(year, month, d);
        const newSubscribers = await User.countDocuments({
          isSubscribed: true,
          subscriptionStartDate: { $gte: startDate, $lte: endDate }
        });
        dataByDay.push({
          x: d, 
          y: newSubscribers || 0, 
        });
      }
      return res.status(200).json({
        status: 'success',
        data: dataByDay,
      });
    }

    if (year && month && day) {
      const newSubscribers = await User.countDocuments({
        isSubscribed: true,
        subscriptionStartDate: { $gte: startDate, $lte: endDate }
      });
      return res.status(200).json({
        status: 'success',
        data: [
          {
            x: day,
            y: newSubscribers || 0, 
          },
        ],
      });
    }

    const newSubscribers = await User.countDocuments({
      isSubscribed: true,
      subscriptionStartDate: { $gte: startDate, $lte: endDate }
    });
    return res.status(200).json({
      status: 'success',
      data: [
        {
          x: new Date().getDate(), 
          y: newSubscribers || 0,
        },
      ],
    });
  } catch (error) {
    next(error);
  }
};


// Controller: Total Orders API
// export const getTotalOrders = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const year = parseQueryParamToNumber(req.query.year as string);
//     const month = parseQueryParamToNumber(req.query.month as string);
//     const day = parseQueryParamToNumber(req.query.day as string);

//     const { startDate, endDate } = getDateRange(year, month, day);

//     // If year is provided, return data for all 12 months of that year
//     if (year && !month) {
//       const dataByMonth = [];

//       for (let m = 1; m <= 12; m++) {
//         const { startDate, endDate } = getDateRange(year, m);
//         const totalOrders = await Order.countDocuments({ date: { $gte: startDate, $lte: endDate } });
//         dataByMonth.push({
//           x: m, // Month number (1 to 12)
//           y: totalOrders || 0, // Total orders for that month, or 0 if no data
//         });
//       }

//       return res.status(200).json({
//         status: 'success',
//         data: dataByMonth,
//       });
//     }

//     // If year and month are provided, return data for each day in the month
//     if (year && month && !day) {
//       const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
//       const dataByDay = [];
//       for (let d = 1; d <= daysInMonth; d++) {
//         const { startDate, endDate } = getDateRange(year, month, d);
//         const totalOrders = await Order.countDocuments({ date: { $gte: startDate, $lte: endDate } });
//         dataByDay.push({
//           x: d, // Day of the month (1, 2, 3, ...)
//           y: totalOrders || 0, // Total orders for that day, or 0 if no data
//         });
//       }

//       return res.status(200).json({
//         status: 'success',
//         data: dataByDay,
//       });
//     }

//     // If year, month, and day are all selected, return data for that specific day
//     if (year && month && day) {
//       const totalOrders = await Order.countDocuments({ date: { $gte: startDate, $lte: endDate } });
//       return res.status(200).json({
//         status: 'success',
//         data: [
//           {
//             x: day, // Day of the month (e.g., 15)
//             y: totalOrders || 0, // Total orders for that specific day, or 0 if no data
//           },
//         ],
//       });
//     }

//     // Default case: Return total orders count for today
//     const totalOrders = await Order.countDocuments({ date: { $gte: startDate, $lte: endDate } });
//     return res.status(200).json({
//       status: 'success',
//       data: [
//         {
//           x: new Date().getDate(), // Today's day
//           y: totalOrders || 0, // Total orders for today
//         },
//       ],
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const getTotalOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseQueryParamToNumber(req.query.year as string);
    const month = parseQueryParamToNumber(req.query.month as string);
    const day = parseQueryParamToNumber(req.query.day as string);

    const { startDate, endDate } = getDateRange(year, month, day);

    if (year && !month) {
      const dataByMonth = [];
      let totalOrdersSum = 0; 
      for (let m = 1; m <= 12; m++) {
        const { startDate, endDate } = getDateRange(year, m);
        const totalOrders = await Order.countDocuments({ date: { $gte: startDate, $lte: endDate } });
        dataByMonth.push({
          x: m,
          y: totalOrders || 0, 
        });
        totalOrdersSum += totalOrders || 0;
      }

      return res.status(200).json({
        status: 'success',
        data: dataByMonth,
        total: totalOrdersSum, 
      });
    }

    if (year && month && !day) {
      const daysInMonth = new Date(year, month, 0).getDate();
      const dataByDay = [];
      let totalOrdersSum = 0; 
      for (let d = 1; d <= daysInMonth; d++) {
        const { startDate, endDate } = getDateRange(year, month, d);
        const totalOrders = await Order.countDocuments({ date: { $gte: startDate, $lte: endDate } });
        dataByDay.push({
          x: d, 
          y: totalOrders || 0, 
        });
        totalOrdersSum += totalOrders || 0; 
      }

      return res.status(200).json({
        status: 'success',
        data: dataByDay,
        total: totalOrdersSum, 
      });
    }

    if (year && month && day) {
      const totalOrders = await Order.countDocuments({ date: { $gte: startDate, $lte: endDate } });
      return res.status(200).json({
        status: 'success',
        data: [
          {
            x: day, 
            y: totalOrders || 0, 
          },
        ],
        total: totalOrders || 0, 
      });
    }

    const totalOrders = await Order.countDocuments({ date: { $gte: startDate, $lte: endDate } });
    return res.status(200).json({
      status: 'success',
      data: [
        {
          x: new Date().getDate(), 
          y: totalOrders || 0,
        },
      ],
      total: totalOrders || 0, 
    });
  } catch (error) {
    next(error);
  }
};


export const getTotalOrdersNumber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalOrders = await Order.countDocuments({});

    return res.status(200).json({
      status: 'success',
      data: [
        {
          x: 'Total',
          y: totalOrders || 0,
        },
      ],
      total: totalOrders || 0,  
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



// export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const year = parseQueryParamToNumber(req.query.year as string);
//     const month = parseQueryParamToNumber(req.query.month as string);
//     const day = parseQueryParamToNumber(req.query.day as string);

//     const { startDate, endDate } = getDateRange(year, month, day);

//     // If year is selected, return data for each month of the year
//     if (year && !month) {
//       const dataByMonth = [];
//       for (let m = 1; m <= 12; m++) {
//         const { startDate, endDate } = getDateRange(year, m);
        
//         // Total Transactions for the Month
//         const totalTransactions = await ParcelRequest.countDocuments({
//           status: { $in: ['accepted', 'delivered'] },
//           createdAt: { $gte: startDate, $lte: endDate }
//         });

//         dataByMonth.push({
//           x: m, // Month number (1 to 12)
//           y: totalTransactions || 0, // Total transactions for that month
//         });
//       }

//       return res.status(200).json({
//         status: 'success',
//         data: dataByMonth,
//       });
//     }

//     // If year and month are selected, return data for each day of the month
//     if (year && month && !day) {
//       const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
//       const dataByDay = [];
//       for (let d = 1; d <= daysInMonth; d++) {
//         const { startDate, endDate } = getDateRange(year, month, d);
        
//         // Total Transactions for the Day
//         const totalTransactions = await ParcelRequest.countDocuments({
//           status: { $in: ['accepted', 'delivered'] },
//           createdAt: { $gte: startDate, $lte: endDate }
//         });

//         dataByDay.push({
//           x: d, // Day of the month (1, 2, 3, ...)
//           y: totalTransactions || 0, // Total transactions for that day
//         });
//       }

//       return res.status(200).json({
//         status: 'success',
//         data: dataByDay,
//       });
//     }

//     // If year, month, and day are all selected, return data for that specific day
//     if (year && month && day) {
//       const totalTransactions = await ParcelRequest.countDocuments({
//         status: { $in: ['accepted', 'delivered'] },
//         createdAt: { $gte: startDate, $lte: endDate }
//       });

//       return res.status(200).json({
//         status: 'success',
//         data: [
//           {
//             x: day, // Day of the month (e.g., 15)
//             y: totalTransactions || 0, // Total transactions for that specific day
//           },
//         ],
//       });
//     }

//     // Default case: Return total transactions count for today
//     const totalTransactions = await ParcelRequest.countDocuments({
//       status: { $in: ['accepted', 'delivered'] },
//       createdAt: { $gte: startDate, $lte: endDate }
//     });

//     return res.status(200).json({
//       status: 'success',
//       data: [
//         {
//           x: new Date().getDate(), // Today's day
//           y: totalTransactions || 0, // Total transactions for today
//         },
//       ],
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = parseQueryParamToNumber(req.query.year as string);
    const month = parseQueryParamToNumber(req.query.month as string);
    const day = parseQueryParamToNumber(req.query.day as string);

    const { startDate, endDate } = getDateRange(year, month, day);

    // If year is selected, return data for each month of the year
    if (year && !month) {
      const dataByMonth = [];
      let totalTransactionsSum = 0;  // Variable to store the total transactions sum
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
        totalTransactionsSum += totalTransactions || 0; // Add to total sum
      }

      return res.status(200).json({
        status: 'success',
        data: dataByMonth,
        total: totalTransactionsSum,  // Dynamically calculated total
      });
    }

    // If year and month are selected, return data for each day of the month
    if (year && month && !day) {
      const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
      const dataByDay = [];
      let totalTransactionsSum = 0;  // Variable to store the total transactions sum
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
        totalTransactionsSum += totalTransactions || 0; // Add to total sum
      }

      return res.status(200).json({
        status: 'success',
        data: dataByDay,
        total: totalTransactionsSum,  // Dynamically calculated total
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
        total: totalTransactions || 0,  // Dynamically calculated total
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
      total: totalTransactions || 0,  // Dynamically calculated total
    });
  } catch (error) {
    next(error);
  }
};
export const getTransactionsTotal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Total Transactions for the entire database, filtering by 'accepted' or 'delivered' status
    const totalTransactions = await ParcelRequest.countDocuments({
      status: { $in: ['accepted', 'delivered'] }
    });

    return res.status(200).json({
      status: 'success',
      data: [
        {
          x: 'Total', // Label indicating this is the total for the entire database
          y: totalTransactions || 0, // Total transactions for the entire database
        },
      ],
      total: totalTransactions || 0,  // Dynamically calculated total for all transactions in the database
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

    const ratingCounts = await User.aggregate([

      { $match: { "reviews": { $exists: true, $ne: [] } } },

      { $unwind: "$reviews" },

      {
        $group: {
          _id: "$reviews.rating", 
          count: { $sum: 1 } 
        }
      },

      { $sort: { _id: 1 } }
    ]);

    console.log("📊 User rating counts:", JSON.stringify(ratingCounts, null, 2));

    if (ratingCounts.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No users found with reviews."
      });
    }

    const userRatings = {
      "star_5": 0,
      "star_4": 0,
      "star_3": 0,
      "star_2": 0,
      "star_1": 0
    };

    
    ratingCounts.forEach((ratingCount) => {
      if (ratingCount._id === 5) userRatings["star_5"] = ratingCount.count;
      if (ratingCount._id === 4) userRatings["star_4"] = ratingCount.count;
      if (ratingCount._id === 3) userRatings["star_3"] = ratingCount.count;
      if (ratingCount._id === 2) userRatings["star_2"] = ratingCount.count;
      if (ratingCount._id === 1) userRatings["star_1"] = ratingCount.count;
    });

    res.status(200).json({
      status: "success",
      data: userRatings
    });
  } catch (error) {
    console.error("❌ Error in getUserRatingCounts:", error);
    next(error);
  }
};


// export const getUserStatistics = async (req: Request, res: Response) => {
//   try {
//     // 1. Total Number of Users
//     const totalUsers = await User.countDocuments();

//     // 2. Active Users in the last 5 days
//     const fiveDaysAgo = moment().subtract(5, 'days').toDate();
//     const activeUsers = await UserActivity.countDocuments({
//       loginTime: { $gte: fiveDaysAgo },
//     });

//     // 3. New Users today
//     const todayStart = moment().startOf('day').toDate();
//     const newUsers = await User.countDocuments({
//       createdAt: { $gte: todayStart },
//     });

//     return res.json({
//       totalUsers,
//       activeUsers,
//       newUsers,
//     });
//   } catch (error) {
//     console.error('Error fetching user statistics', error);
//     return res.status(500).json({ message: 'Error fetching user statistics' });
//   }
// };

export const getUserStatistics = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 10, day, month, year } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Build the filter object based on status and date filters (day, month, year)
    let filter: any = {};

    // Date filters based on day, month, and year
    if (year || month || day) {
      let startDate = moment();
      let endDate = moment();

      // If year is provided, filter by the start and end of the year
      if (year) {
        startDate = startDate.year(parseInt(year as string, 10)).startOf('year');
        endDate = endDate.year(parseInt(year as string, 10)).endOf('year');
      }

      // If month is provided, filter by the start and end of the month
      if (month) {
        startDate = startDate.month(parseInt(month as string, 10) - 1).startOf('month');
        endDate = endDate.month(parseInt(month as string, 10) - 1).endOf('month');
      }

      // If day is provided, filter by the start and end of the day
      if (day) {
        startDate = startDate.date(parseInt(day as string, 10)).startOf('day');
        endDate = endDate.date(parseInt(day as string, 10)).endOf('day');
      }

      filter.createdAt = { $gte: startDate.toDate(), $lte: endDate.toDate() };
    }

    // If status filter is provided, add it to the filter
    if (status) {
      const statusUpperCase = status.toString().toUpperCase();
      filter.status = statusUpperCase; // Assuming status is in upper case in the database
    }

    // 1. Total Number of Users
    const totalUsers = await User.countDocuments();

    // 2. Active Users in the specified date range
    const activeUserIds = await UserActivity.find({
      loginTime: { $gte: filter.createdAt?.$gte, $lte: filter.createdAt?.$lte }, // Filter based on createdAt date range
    }).distinct('userId');

    console.log("Active User IDs in the specified date range:", activeUserIds); // Debugging log to verify active user IDs

    // 3. New Users today
    const todayStart = moment().startOf('day').toDate();
    const newUsers = await User.countDocuments({
      createdAt: { $gte: todayStart },
    });

    // 4. Active User Details
    const activeUserDetails = await User.find({
      _id: { $in: activeUserIds },
    }).select('fullName email profileImage lastLoginTime');

    console.log("Active User Details:", activeUserDetails); // Debugging log for active users

    return res.json({
      totalUsers,
      activeUsers: activeUserDetails.length, // Active users count
      activeUserDetails, // Active user details
      newUsers,
    });
  } catch (error) {
    console.error('Error fetching user statistics', error);
    return res.status(500).json({ message: 'Error fetching user statistics' });
  }
};

export const getUserRatingsStatistics = async (req: Request, res: Response) => {
  try {
    // Aggregate ratings by grouping them
    const ratingsStats = await User.aggregate([
      { $unwind: "$reviews" }, 
      { $group: { _id: "$reviews.rating", count: { $sum: 1 } } }, 
      { $sort: { _id: 1 } }
    ]);

    // Create a result object with ratings from 1 to 5
    const ratingsCount: { [key in 1 | 2 | 3 | 4 | 5]: number } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    // Fill the result object based on aggregated data
    ratingsStats.forEach(stat => {
      if (ratingsCount.hasOwnProperty(stat._id)) {
        ratingsCount[stat._id as 1 | 2 | 3 | 4 | 5] = stat.count;
      }
    });

    res.json({
      status: 'success',
      data: ratingsCount, // This will return the count of users with each rating
    });
  } catch (error) {
    console.error('Error fetching user ratings statistics', error);
    return res.status(500).json({ message: 'Error fetching user ratings statistics' });
  }
};
