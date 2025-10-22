import { Request, Response, NextFunction } from 'express';
import { ParcelRequest } from '../parcel/ParcelRequest.model';  // Import ParcelRequest model
import { AppError } from '../../middlewares/error';
import { User } from '../user/user.model';  // Import User model to fetch user details
import mongoose from 'mongoose';
import { Order } from '../parcel/order.model';



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


