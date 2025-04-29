// delivery.controller.ts
import { AuthRequest } from '../../middlewares/auth';
import { AppError } from '../../middlewares/error';
import { ParcelRequest } from './ParcelRequest.model'

import { Request, Response, NextFunction } from 'express';
import { DeliveryStatus, UserRole } from '../../../types/enums';
import mongoose from 'mongoose';
import { Receive } from 'twilio/lib/twiml/FaxResponse';
import { User } from '../user/user.model';
import { Subscription } from '../../models/subscription.model';
import { Notification } from '../notification/notification.model';
import admin from "firebase-admin";


// export const requestToDeliver = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const { parcelIds } = req.body;  
//     const userId = req.user?.id;    

//     if (!userId) {
//       throw new AppError("Unauthorized", 401);
//     }

//     // Convert the parcelIds array into an array of ObjectIds
//     const parcelObjectIds = parcelIds.map((id: string) => new mongoose.Types.ObjectId(id));
//     console.log("Converted parcelIds to ObjectIds:", parcelObjectIds);

//     // Convert userId to ObjectId
//     const userObjectId = new mongoose.Types.ObjectId(userId);
//     console.log("Converted userId to ObjectId:", userObjectId);

//     // Find the parcels by the provided ObjectIds
//     const parcels = await ParcelRequest.find({
//       _id: { $in: parcelObjectIds }, // Find parcels with ids in the parcelIds array
//       status: DeliveryStatus.PENDING, // Make sure the parcels are available (PENDING status)
//     });

//     if (parcels.length === 0) {
//       throw new AppError("No available parcels found", 404);
//     }

//     // Find the delivery man (user)
//     const user = await User.findById(userObjectId);  // Convert userId to ObjectId
//     if (!user) {
//       throw new AppError("User not found", 404);
//     }

//     // Loop through each parcel and check for duplicate requests
//     for (let parcel of parcels) {
//       // Prevent the same delivery man from requesting the same parcel multiple times
//       if (parcel.deliveryRequests.includes(userObjectId)) {
//         throw new AppError(`You have already requested to deliver parcel ${parcel._id}`, 400);
//       }

//       // Add the delivery man's request to the deliveryRequests array
//       parcel.deliveryRequests.push(userObjectId);

//       // Update the parcel status to "REQUESTED"
//       parcel.status = DeliveryStatus.REQUESTED;

//       // Save the updated parcel
//       await parcel.save();
//     }

//     res.status(200).json({
//       status: "success",
//       message: "Your request to deliver the parcel(s) has been submitted successfully.",
//     });
//   } catch (error) {
//     next(error);
//   }
// };
export const requestToDeliver = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { parcelIds } = req.body;  
    const userId = req.user?.id;    

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const parcelObjectIds = parcelIds.map((id: string) => new mongoose.Types.ObjectId(id));
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const parcels = await ParcelRequest.find({
      _id: { $in: parcelObjectIds },
      status: DeliveryStatus.PENDING,
    });
   
    //check if parcel are same user to request then show your the owner this parcel not able to request
    for (let parcel of parcels) {
      if (parcel.senderId.toString() === userObjectId.toString()) {
        throw new AppError(`You can't request to deliver your own parcel ${parcel._id}`, 400);
      }
    }

    if (parcels.length === 0) {
      throw new AppError("No available parcels found", 404);
    }

    const user = await User.findById(userObjectId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    for (let parcel of parcels) {
      if (parcel.deliveryRequests.includes(userObjectId)) {
        throw new AppError(`You have already requested to deliver parcel ${parcel._id}`, 400);
      }

      parcel.deliveryRequests.push(userObjectId);
      parcel.status = DeliveryStatus.REQUESTED;
      await parcel.save();

      // 🚀 Start Notification Logic here
      const senderUser = await User.findById(parcel.senderId);

      if (senderUser?.fcmToken) {
        const senderMessage = {
          notification: {
            title: 'New Delivery Request',
            body: `${user.role === 'recciver' ? 'A deliverer has requested' : 'A user has requested'} to deliver your parcel titled "${parcel.title}".`,
            mobileNumber: user.mobileNumber || 'Unknown Number',
          },
          token: senderUser.fcmToken,
        };

        try {
          await admin.messaging().send(senderMessage);
          console.log('Push notification sent to sender.');
        } catch (err) {
          console.error('Error sending push notification to sender:', err);
        }
      }

      const notification = new Notification({
        message: `${user.role === 'recciver' ? 'A deliverer has requested' : 'A user has requested'} to deliver your parcel titled "${parcel.title}".`,
        type: 'parcel_update',
        title: 'New Delivery Request',
        description: parcel.description || '',
        parcelTitle: parcel.title || '',
        price: parcel.price || '',
        requestId: parcel._id,
        userId: senderUser?._id,
        SenderName: user.fullName || 'Unknown User',
        mobileNumber: user.mobileNumber || 'Unknown Number',
        
      });

      await notification.save();
      // 🚀 End Notification Logic
    }

    res.status(200).json({
      status: "success",
      message: "Your request to deliver the parcel(s) has been submitted successfully.",
    });

  } catch (error) {
    next(error);
  }
};

export const removeDeliveryRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { parcelId, delivererId } = req.body;
    const userId = req.user?.id;

    if (!userId) throw new AppError("Unauthorized", 401);

    const parcel = await ParcelRequest.findById(parcelId);
    if (!parcel) throw new AppError("Parcel not found", 404);

    if (parcel.senderId.toString() !== userId) {
      throw new AppError("Only the sender can remove delivery requests", 403);
    }
    const delivererObjectId = new mongoose.Types.ObjectId(delivererId);
    if (!parcel.deliveryRequests.includes(delivererObjectId)) {
      throw new AppError("This delivery man has not requested the parcel", 400);
    }


    parcel.deliveryRequests = parcel.deliveryRequests.filter(
      (requesterId) => requesterId.toString() !== delivererObjectId.toString()
    );

    if (parcel.deliveryRequests.length === 0 && parcel.status === DeliveryStatus.REQUESTED) {
      parcel.status = DeliveryStatus.PENDING;
    }

    await parcel.save();

    res.status(200).json({
      status: "success",
      message: "Delivery request removed successfully",
    });
  } catch (error) {
    next(error);
  }
};



// export const assignDeliveryMan = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const { parcelId, delivererId } = req.body;
//     const userId = req.user?.id;

//     if (!userId) throw new AppError("Unauthorized", 401);

//     const parcel = await ParcelRequest.findById(parcelId);
//     if (!parcel) throw new AppError("Parcel not found", 404);

//     // Ensure only the sender can assign a delivery man
//     if (parcel.senderId.toString() !== userId) {
//       throw new AppError("Only the sender can assign a delivery man", 403);
//     }

//     const delivererObjectId = new mongoose.Types.ObjectId(delivererId);

//     // Ensure the selected delivery man has requested the parcel
//     if (!parcel.deliveryRequests.includes(delivererObjectId)) {
//       throw new AppError("The selected delivery man has not requested this parcel", 400);
//     }

//     // ✅ Assign the delivery man and update status to "IN_TRANSIT"
//     parcel.assignedDelivererId = delivererObjectId;
//     parcel.status = DeliveryStatus.IN_TRANSIT;
//     parcel.deliveryRequests = [];
//     await parcel.save();

//     await User.findByIdAndUpdate(delivererId, {
//       $push: {
//         RecciveOrders: {
//           parcelId: parcel._id,
//           pickupLocation: parcel.pickupLocation?.coordinates ? 
//             `${parcel.pickupLocation.coordinates[1]},${parcel.pickupLocation.coordinates[0]}` : "",
//           deliveryLocation: parcel.deliveryLocation?.coordinates ? 
//             `${parcel.deliveryLocation.coordinates[1]},${parcel.deliveryLocation.coordinates[0]}` : "",
//           price: parcel.price,
//           title: parcel.title,
//           description: parcel.description,
//           senderType: parcel.senderType,
//           deliveryType: parcel.deliveryType,
//           deliveryStartTime: parcel.deliveryStartTime,
//           deliveryEndTime: parcel.deliveryEndTime,
//         }
//       },
//       $inc: { totalReceivedParcels: 1 }
//     });
    
//     // ✅ Automatically update the assigned user's role to `RECEIVER` if they are currently `SENDER`
//     const deliverer = await User.findById(delivererId);
//     if (deliverer && deliverer.role === UserRole.SENDER) {
//       deliverer.role = UserRole.recciver;
//       await deliverer.save();
//     }

//     res.status(200).json({
//       status: "success",
//       message: "Delivery man assigned successfully",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const assignDeliveryMan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { parcelId, delivererId } = req.body;
    const userId = req.user?.id;

    if (!userId) throw new AppError("Unauthorized", 401);

    const parcel = await ParcelRequest.findById(parcelId);
    if (!parcel) throw new AppError("Parcel not found", 404);

    if (parcel.senderId.toString() !== userId) {
      throw new AppError("Only the sender can assign a delivery man", 403);
    }

const delivererObjectId = new mongoose.Types.ObjectId(delivererId);

// Check if any of the ObjectIds in deliveryRequests match the deliverer's ID
const hasRequested = parcel.deliveryRequests.some(requestId => 
  requestId.toString() === delivererObjectId.toString()
);

if (!hasRequested) {
  throw new AppError("The selected delivery man has not requested this parcel", 400);
}

    parcel.assignedDelivererId = delivererObjectId;
    parcel.status = DeliveryStatus.IN_TRANSIT;
    parcel.deliveryRequests = [];
    await parcel.save();

    await User.findByIdAndUpdate(delivererId, {
      $push: {
        RecciveOrders: {
          parcelId: parcel._id,
          pickupLocation: parcel.pickupLocation?.coordinates ? 
            `${parcel.pickupLocation.coordinates[1]},${parcel.pickupLocation.coordinates[0]}` : "",
          deliveryLocation: parcel.deliveryLocation?.coordinates ? 
            `${parcel.deliveryLocation.coordinates[1]},${parcel.deliveryLocation.coordinates[0]}` : "",
          price: parcel.price,
          title: parcel.title,
          description: parcel.description,
          senderType: parcel.senderType,
          deliveryType: parcel.deliveryType,
          deliveryStartTime: parcel.deliveryStartTime,
          deliveryEndTime: parcel.deliveryEndTime,
        }
      },
      $inc: { totalReceivedParcels: 1 }
    });

    const deliverer = await User.findById(delivererId);

    if (deliverer && deliverer.role === UserRole.SENDER) {
      deliverer.role = UserRole.recciver;
      await deliverer.save();
    }

    // 🚀 Start Notification Logic here
    if (deliverer?.fcmToken) {
      const delivererMessage = {
        notification: {
          title: 'Parcel Assigned',
          body: `You have been assigned to deliver the parcel titled "${parcel.title}".`,

        },
        token: deliverer.fcmToken,
      };

      try {
        await admin.messaging().send(delivererMessage);
        console.log('Push notification sent to assigned deliverer.');
      } catch (err) {
        console.error('Error sending push notification to deliverer:', err);
      }
    }

    const notification = new Notification({
      message: `You have been assigned to deliver the parcel titled "${parcel.title}".`,
      type: 'parcel_assignment',
      title: 'Parcel Assigned',
      description: parcel.description || '',
      price: parcel.price || '',
      requestId: parcel._id,
      userId: deliverer?._id,
      SenderName: (await User.findById(parcel.senderId))?.fullName || 'Unknown Sender',
      role: deliverer?.role,
    });

    await notification.save();
    // 🚀 End Notification Logic

    res.status(200).json({
      status: "success",
      message: "Delivery man assigned successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const cancelAssignedDeliveryMan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { parcelId } = req.body;
    const userId = req.user?.id;

    if (!userId) throw new AppError("Unauthorized", 401);

    const parcel = await ParcelRequest.findById(parcelId);
    if (!parcel) throw new AppError("Parcel not found", 404);

    // Ensure only the sender can cancel the delivery man
    if (parcel.senderId.toString() !== userId) {
      throw new AppError("Only the sender can cancel the assigned delivery man", 403);
    }

    // Revert parcel status to `PENDING` and clear assigned delivery man
    parcel.status = DeliveryStatus.PENDING;
    parcel.assignedDelivererId = null; 
    await parcel.save();

  
    parcel.deliveryRequests = [];
    await parcel.save();

    res.status(200).json({
      status: "success",
      message: "Delivery man assignment canceled and parcel status reset to PENDING",
    });
  } catch (error) {
    next(error);
  }
};

export const cancelParcelDelivery = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { parcelId } = req.body;
    const userId = req.user?.id;

    if (!userId) throw new AppError("Unauthorized", 401);

    const parcel = await ParcelRequest.findById(parcelId);
    if (!parcel) throw new AppError("Parcel not found", 404);

    // Ensure only the sender can cancel the delivery man
    if (!parcel.deliveryId || parcel.deliveryId.toString() !== userId) {
      throw new AppError("Only the DeliveryMan can cancel the assigned Parcel", 403);
    }

    // Revert parcel status to `PENDING` and clear assigned delivery man
    parcel.status = DeliveryStatus.PENDING;
    parcel.assignedDelivererId = null; 
    await parcel.save();

  
    parcel.deliveryRequests = [];
    await parcel.save();

    res.status(200).json({
      status: "success",
      message: "Delivery man canceled parcel and status reset to PENDING",
    });
  } catch (error) {
    next(error);
  }
};

export const cancelDeliveryRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { parcelId, delivererId } = req.body;
    const userId = req.user?.id;

    if (!userId) throw new AppError("Unauthorized", 401);


    const parcel = await ParcelRequest.findById(parcelId);
    if (!parcel) throw new AppError("Parcel not found", 404);
    if (parcel.senderId.toString() !== userId) {
      throw new AppError("Only the sender can cancel the delivery man", 403);
    }

    const delivererObjectId = new mongoose.Types.ObjectId(delivererId);

    const deliveryRequestIndex = parcel.deliveryRequests.findIndex(
      (request) => request._id.toString() === delivererObjectId.toString()
    );

    if (deliveryRequestIndex === -1) {

      throw new AppError("The selected delivery man has not requested this parcel", 400);
    }


    parcel.deliveryRequests.splice(deliveryRequestIndex, 1);

    parcel.assignedDelivererId = null;
    parcel.status = DeliveryStatus.PENDING;
    await parcel.save();


    const deliverer = await User.findById(delivererId);
    if (deliverer && deliverer.role === UserRole.recciver) {
      deliverer.role = UserRole.SENDER; 
      await deliverer.save();
    }

    res.status(200).json({
      status: "success",
      message: "Delivery man canceled successfully",
    });
  } catch (error) {
    next(error);
  }
};


export const acceptDeliveryOffer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { parcelId, delivererId } = req.body;
    const senderId = req.user?.id; 

    if (!senderId) throw new AppError('Unauthorized', 401);

    const parcel = await ParcelRequest.findById(parcelId);
    if (!parcel) throw new AppError('Parcel not found', 404);

    if (parcel.senderId.toString() !== senderId) throw new AppError('You are not the owner of this parcel', 403);

    if (!parcel.deliveryRequests.includes(delivererId)) throw new AppError('Deliverer has not requested this parcel', 400);

    // Assign the delivery to the chosen deliverer
    parcel.assignedDelivererId = delivererId;
    parcel.status = DeliveryStatus.IN_TRANSIT; // Change status to 'accepted'
    parcel.deliveryRequests = [];
    await parcel.save();

    res.status(200).json({ status: 'success', message: 'Deliverer assigned successfully', data: parcel });
  } catch (error) {
    next(error);
  }
};


// export const updateParcelStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const { parcelId, status } = req.body;
//     const delivererId = req.user?.id; // Delivery man's ID from the token

//     if (!delivererId) throw new AppError('Unauthorized', 401);

//     // Validate status
//     if (![DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED].includes(status)) {
//       throw new AppError('Invalid status', 400);
//     }

//     const parcel = await ParcelRequest.findById(parcelId);
//     if (!parcel) throw new AppError('Parcel not found', 404);

//     // Check if the deliverer is the assigned one
//     if (!parcel.assignedDelivererId || !parcel.assignedDelivererId.equals(delivererId)) {
//       throw new AppError('You are not assigned to this parcel', 403);
//     }

//     // Find the user's current subscription
//     const userSubscription = await Subscription.findOne({ 
//       userId: delivererId, 
//       expiryDate: { $gt: new Date() } 
//     }).sort({ createdAt: -1 });

//     // Find the user
//     const user = await User.findById(delivererId);
//     if (!user) throw new AppError('User not found', 404);

//     // Check subscription limits
//     if (status === DeliveryStatus.DELIVERED) {
//       // If no active subscription, use default limits
//       if (!userSubscription) {
//         // Default Basic Plan Limit
//         if (user.totalDelivered >= 20) {
//           throw new AppError('Delivery limit reached. Upgrade your subscription.', 403);
//         }
//       } else {
//         // Check against subscription plan's delivery limit
//         if (user.totalDelivered >= userSubscription.deliveryLimit) {
//           throw new AppError('Subscription delivery limit reached. Upgrade your plan.', 403);
//         }
//       }

//       // Increment totalDelivered
//       user.totalDelivered = (user.totalDelivered || 0) + 1;
//       await user.save();
//     }

//     // Update parcel status
//     parcel.status = status;
//     await parcel.save();

//     res.status(200).json({ 
//       status: 'success', 
//       message: `Parcel status updated to ${status}`, 
//       data: parcel,
//       deliveryLimit: {
//         total: userSubscription ? userSubscription.deliveryLimit : 20,
//         current: user.totalDelivered
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const updateParcelStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { parcelId, status } = req.body;
    const delivererId = req.user?.id;

    if (!delivererId) throw new AppError('Unauthorized', 401);

    // Validate status
    if (![DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const parcel = await ParcelRequest.findById(parcelId);
    if (!parcel) throw new AppError('Parcel not found', 404);

    // Check if the deliverer is the assigned one
    if (!parcel.assignedDelivererId || !parcel.assignedDelivererId.equals(delivererId)) {
      throw new AppError('You are not assigned to this parcel', 403);
    }

    // Find the user who owns the parcel (sender)
    const user = await User.findById(parcel.senderId);
    if (!user) throw new AppError('User not found', 404);

    if (status === DeliveryStatus.DELIVERED) {
      user.totalDelivered = (user.totalDelivered || 0) + 1;
      user.totalEarning = (user.totalEarning || 0) + parcel.price;
      user.monthlyEarnings = (user.monthlyEarnings || 0) + parcel.price;
      user.totalSentParcels = (user.totalSentParcels || 0) + 1; 
      await user.save();
    }
   
    parcel.status = status;
    await parcel.save();

    res.status(200).json({
      status: 'success',
      message: `Parcel status updated to ${status}`,
      data: parcel,
    });
  } catch (error) {
    next(error);
  }
};



export const updateGlobalFreeDeliveries = async (req: Request, res: Response) => {
  try {
    const { freeDeliveries } = req.body;

    if (freeDeliveries === undefined) {
      return res.status(400).json({ message: "Free deliveries value is required" });
    }

    // Update all users with the new freeDeliveries value
    await User.updateMany({}, { freeDeliveries });

    res.status(200).json({
      message: `Global free deliveries updated to ${freeDeliveries} for all users`
    });
  } catch (error) {
    console.error("Error updating global free deliveries:", error);
    res.status(500).json({ message: "Error updating global free deliveries", error });
  }
};


//Admin Assign single or multiple user free delivery

export const assignFreeDeliveriesToUser = async (req: Request, res: Response) => {
  try {
    const { userIds, freeDeliveries } = req.body;

    if (!userIds || userIds.length === 0) {
      return res.status(400).json({ message: "User IDs are required" });
    }

    if (freeDeliveries === undefined) {
      return res.status(400).json({ message: "Free deliveries value is required" });
    }

    // Assign free deliveries to specific users
    const updatedUsers = await User.updateMany(
      { _id: { $in: userIds } },  // Find users by their IDs
      { freeDeliveries }  // Update the free deliveries for them
    );

    // Use `modifiedCount` instead of `nModified`
    if (updatedUsers.modifiedCount === 0) {
      return res.status(404).json({ message: "No users found with the provided IDs" });
    }

    res.status(200).json({
      message: `Free deliveries updated to ${freeDeliveries} for specified users`
    });
  } catch (error) {
    console.error("Error assigning free deliveries to user(s):", error);
    res.status(500).json({ message: "Error assigning free deliveries", error });
  }
};

export const postReviewForUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { parcelId, rating, review, targetUserId } = req.body;

    if (!parcelId || !rating || !review || !targetUserId) {
      throw new AppError("Parcel ID, rating, review, and target user ID are required", 400);
    }

    // Validate rating and review
    if (rating < 1 || rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    if (review.trim().length > 500) {
      throw new AppError("Review text cannot exceed 500 characters", 400);
    }

    // Find the parcel by ID
    const parcel = await ParcelRequest.findById(parcelId);
    if (!parcel) {
      throw new AppError("Parcel not found", 404);
    }

    // Ensure that the parcel status is DELIVERED
    if (parcel.status !== DeliveryStatus.DELIVERED) {
      throw new AppError("Parcel must be delivered before submitting a review", 400);
    }

    // Find the target user (sender or receiver)
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new AppError("Target user not found", 404);
    }

    // Add the rating and review to the target user's profile
    targetUser.reviews.push({
      parcelId: parcel._id,
      rating,
      review
    });

    await targetUser.save();

    // Respond with success message
    res.status(200).json({
      status: "success",
      message: `Review and rating submitted for user with ID ${targetUserId} successfully`
    });
  } catch (error) {
    next(error);
  }
};


export const getReviewsForUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params; // User ID whose reviews are being fetched

    // Find the user by userId
    const user = await User.findById(userId).populate('reviews.parcelId'); // Populate parcel details if needed

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Send the reviews associated with this user
    res.status(200).json({
      status: "success",
      message: "Reviews fetched successfully",
      data: user.reviews, // All reviews associated with the user
    });
  } catch (error) {
    next(error);
  }
};
