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



export const requestToDeliver = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { parcelIds } = req.body;  // Array of parcelIds that the delivery man wants to request
    const userId = req.user?.id;     // Get the authenticated user (delivery man)

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    // Convert the parcelIds array into an array of ObjectIds
    const parcelObjectIds = parcelIds.map((id: string) => new mongoose.Types.ObjectId(id));
    console.log("Converted parcelIds to ObjectIds:", parcelObjectIds);

    // Convert userId to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    console.log("Converted userId to ObjectId:", userObjectId);

    // Find the parcels by the provided ObjectIds
    const parcels = await ParcelRequest.find({
      _id: { $in: parcelObjectIds }, // Find parcels with ids in the parcelIds array
      status: DeliveryStatus.PENDING, // Make sure the parcels are available (PENDING status)
    });

    if (parcels.length === 0) {
      throw new AppError("No available parcels found", 404);
    }

    // Find the delivery man (user)
    const user = await User.findById(userObjectId);  // Convert userId to ObjectId
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Loop through each parcel and check for duplicate requests
    for (let parcel of parcels) {
      // Prevent the same delivery man from requesting the same parcel multiple times
      if (parcel.deliveryRequests.includes(userObjectId)) {
        throw new AppError(`You have already requested to deliver parcel ${parcel._id}`, 400);
      }

      // Add the delivery man's request to the deliveryRequests array
      parcel.deliveryRequests.push(userObjectId);

      // Update the parcel status to "REQUESTED"
      parcel.status = DeliveryStatus.REQUESTED;

      // Save the updated parcel
      await parcel.save();
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

    // Find the parcel
    const parcel = await ParcelRequest.findById(parcelId);
    if (!parcel) throw new AppError("Parcel not found", 404);

    // Ensure the sender is the one who owns the parcel
    if (parcel.senderId.toString() !== userId) {
      throw new AppError("Only the sender can remove delivery requests", 403);
    }

    // Ensure the deliverer exists in the delivery requests
    const delivererObjectId = new mongoose.Types.ObjectId(delivererId);
    if (!parcel.deliveryRequests.includes(delivererObjectId)) {
      throw new AppError("This delivery man has not requested the parcel", 400);
    }

    // Remove the delivery request
    parcel.deliveryRequests = parcel.deliveryRequests.filter(
      (requesterId) => requesterId.toString() !== delivererObjectId.toString()
    );

    // If no delivery requests are left, change status back to PENDING
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



export const assignDeliveryMan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { parcelId, delivererId } = req.body;
    const userId = req.user?.id;

    if (!userId) throw new AppError("Unauthorized", 401);

    const parcel = await ParcelRequest.findById(parcelId);
    if (!parcel) throw new AppError("Parcel not found", 404);

    // Ensure only the sender can assign a delivery man
    if (parcel.senderId.toString() !== userId) {
      throw new AppError("Only the sender can assign a delivery man", 403);
    }

    const delivererObjectId = new mongoose.Types.ObjectId(delivererId);

    // Ensure the selected delivery man has requested the parcel
    if (!parcel.deliveryRequests.includes(delivererObjectId)) {
      throw new AppError("The selected delivery man has not requested this parcel", 400);
    }

    // ✅ Assign the delivery man and update status to "IN_TRANSIT"
    parcel.assignedDelivererId = delivererObjectId;
    parcel.status = DeliveryStatus.IN_TRANSIT;
    parcel.deliveryRequests = []; // Clear other requests
    await parcel.save();

    // ✅ Automatically update the assigned user's role to `RECEIVER` if they are currently `SENDER`
    const deliverer = await User.findById(delivererId);
    if (deliverer && deliverer.role === UserRole.SENDER) {
      deliverer.role = UserRole.recciver;
      await deliverer.save();
    }

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

    // Find the parcel
    const parcel = await ParcelRequest.findById(parcelId);
    if (!parcel) throw new AppError("Parcel not found", 404);

    // Ensure only the sender can cancel the delivery man
    if (parcel.senderId.toString() !== userId) {
      throw new AppError("Only the sender can cancel the assigned delivery man", 403);
    }

    // Revert parcel status to `PENDING` and clear assigned delivery man
    parcel.status = DeliveryStatus.PENDING;
    parcel.assignedDelivererId = null; // Remove the assigned delivery man
    await parcel.save();

    // ✅ Make the parcel available for anyone to request again (reset deliveryRequests)
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



export const acceptDeliveryOffer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { parcelId, delivererId } = req.body;
    const senderId = req.user?.id; // Parcel owner's ID

    if (!senderId) throw new AppError('Unauthorized', 401);

    const parcel = await ParcelRequest.findById(parcelId);
    if (!parcel) throw new AppError('Parcel not found', 404);

    if (parcel.senderId.toString() !== senderId) throw new AppError('You are not the owner of this parcel', 403);

    if (!parcel.deliveryRequests.includes(delivererId)) throw new AppError('Deliverer has not requested this parcel', 400);

    // Assign the delivery to the chosen deliverer
    parcel.assignedDelivererId = delivererId;
    parcel.status = DeliveryStatus.ACCEPTED; // Change status to 'accepted'
    parcel.deliveryRequests = []; // Clear requests after assigning
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

//     // Update parcel status
//     parcel.status = status;
//     await parcel.save();

//     res.status(200).json({ status: 'success', message: `Parcel status updated to ${status}`, data: parcel });
//   } catch (error) {
//     next(error);
//   }
// };


//Admin Assign Default all user freeDelivery

export const updateParcelStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { parcelId, status } = req.body;
    const delivererId = req.user?.id; // Delivery man's ID from the token

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

    // Find the user's current subscription
    const userSubscription = await Subscription.findOne({ 
      userId: delivererId, 
      expiryDate: { $gt: new Date() } 
    }).sort({ createdAt: -1 });

    // Find the user
    const user = await User.findById(delivererId);
    if (!user) throw new AppError('User not found', 404);

    // Check subscription limits
    if (status === DeliveryStatus.DELIVERED) {
      // If no active subscription, use default limits
      if (!userSubscription) {
        // Default Basic Plan Limit
        if (user.totalDelivered >= 20) {
          throw new AppError('Delivery limit reached. Upgrade your subscription.', 403);
        }
      } else {
        // Check against subscription plan's delivery limit
        if (user.totalDelivered >= userSubscription.deliveryLimit) {
          throw new AppError('Subscription delivery limit reached. Upgrade your plan.', 403);
        }
      }

      // Increment totalDelivered
      user.totalDelivered = (user.totalDelivered || 0) + 1;
      await user.save();
    }

    // Update parcel status
    parcel.status = status;
    await parcel.save();

    res.status(200).json({ 
      status: 'success', 
      message: `Parcel status updated to ${status}`, 
      data: parcel,
      deliveryLimit: {
        total: userSubscription ? userSubscription.deliveryLimit : 20,
        current: user.totalDelivered
      }
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

