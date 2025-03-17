import { Request, Response, NextFunction } from 'express';
import { ParcelRequest } from '../parcel/ParcelRequest.model';  // Import ParcelRequest model
import { AppError } from '../../middlewares/error';
import { User } from '../user/user.model';  // Import User model to fetch user details
import mongoose from 'mongoose';
import { Order } from '../parcel/order.model';

// export const getTransactionSummary = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     // Aggregate to get total number of transactions and total price
//     const transactionSummary = await ParcelRequest.aggregate([
//       {
//         $match: {
//           status: { $in: ['accepted', 'delivered'] }  // Consider only accepted or delivered parcels
//         }
//       },
//       {
//         $group: {
//           _id: null,  // Group by null to get total for all transactions
//           totalTransactions: { $sum: 1 },  // Count total transactions
//           totalRevenue: { $sum: "$price" }  // Sum the price of all transactions
//         }
//       }
//     ]);

//     // If no transactions exist, return an empty response
//     if (transactionSummary.length === 0) {
//       return res.status(200).json({
//         status: 'success',
//         message: 'No transactions found',
//         data: {
//           totalTransactions: 0,
//           totalRevenue: 0
//         }
//       });
//     }

//     // Fetch the total transaction count and revenue from the aggregation result
//     const { totalTransactions, totalRevenue } = transactionSummary[0];

//     // Now, populate the sender and receiver details for the transactions
//     const parcelRequests = await ParcelRequest.find({
//       status: { $in: ['accepted', 'delivered'] }  // Only accepted or delivered parcels
//     })
//       .populate('senderId', 'fullName email phoneNumber role')  // Populate sender user details
//       .populate('receiverId', 'fullName email phoneNumber role')  // Populate receiver user details
//       .select('pickupLocation deliveryLocation price status senderId receiverId');

//     res.status(200).json({
//       status: 'success',
//       message: 'Transaction summary fetched successfully',
//       data: {
//         totalTransactions,
//         totalRevenue,
//         transactions: parcelRequests
//       }
//     });

//   } catch (error) {
//     next(error);  // Pass error to the global error handler
//   }
// };



export const getTransactionSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    // Total Users
    const totalUsers = await User.countDocuments();
    
    // New Users in Last Week
    const newUsers = await User.countDocuments({ createdAt: { $gte: lastWeek } });
    
    // Total Subscribers
    const totalSubscribers = await User.countDocuments({ isSubscribed: true });
    
    // New Subscribers in Last Week
    const newSubscribers = await User.countDocuments({ 
      isSubscribed: true, 
      subscriptionStartDate: { $gte: lastWeek } 
    });
    
    // Total Completed Parcels (Delivered)
    const totalOrders = await ParcelRequest.countDocuments({ status: 'delivered' });
    
    // New Orders in Last Week (All status parcels in the last week)
    const newOrders = await ParcelRequest.countDocuments({ createdAt: { $gte: lastWeek } });
    
    // Total Transactions with Details
    const totalTransactions = await ParcelRequest.find({ status: { $in: ['accepted', 'delivered'] } })
      .populate('senderId', 'fullName email phoneNumber role')
      .populate('receiverId', 'fullName email phoneNumber role');
    
    // Last Week's Transactions with Details
    const lastWeekTransactions = await ParcelRequest.find({
      status: { $in: ['accepted', 'delivered'] },
      createdAt: { $gte: lastWeek }
    })
      .populate('senderId', 'fullName email phoneNumber role')
      .populate('receiverId', 'fullName email phoneNumber role');
    
    res.status(200).json({
      status: 'success',
      message: 'Transaction summary fetched successfully',
      data: {
        totalUsers,
        newUsers,
        totalSubscribers,
        newSubscribers,
        totalOrders,
        newOrders,
        totalTransactions,
        lastWeekTransactions
      }
    });
  } catch (error) {
    next(error);
  }
};


