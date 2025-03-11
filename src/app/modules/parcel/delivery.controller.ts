// delivery.controller.ts
import { AuthRequest } from '../../middlewares/auth';
import { AppError } from '../../middlewares/error';
import { ParcelRequest } from './ParcelRequest.model'

import { Request, Response, NextFunction } from 'express';
import { DeliveryStatus, UserRole } from '../../../types/enums';
import mongoose from 'mongoose';
import { Receive } from 'twilio/lib/twiml/FaxResponse';
import { User } from '../user/user.model';




// export const requestToDeliver = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const { parcelId } = req.body;
//     const delivererId = req.user?.id; // Delivery man ID from token

//     if (!delivererId) throw new AppError('Unauthorized', 401);

//     // Convert delivererId (string) to ObjectId
//     const delivererObjectId = new mongoose.Types.ObjectId(delivererId);

//     const parcel = await ParcelRequest.findById(parcelId);
//     if (!parcel) throw new AppError('Parcel not found', 404);

//     if (parcel.assignedDelivererId) throw new AppError('Parcel already assigned to a deliverer', 400);

//     // Check if delivererObjectId is already in the deliveryRequests array
//     if (parcel.deliveryRequests.some((id) => id.equals(delivererObjectId))) {
//       throw new AppError('You have already requested to deliver this parcel', 400);
//     }

//     // Push ObjectId instead of string
//     parcel.deliveryRequests.push(delivererObjectId);
//     await parcel.save();

//     res.status(200).json({ status: 'success', message: 'Request sent to deliver the parcel' });
//   } catch (error) {
//     next(error);
//   }
// };



// export const acceptDeliveryOffer = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const { parcelId, delivererId } = req.body;
//     const senderId = req.user?.id; // Parcel owner's ID

//     if (!senderId) throw new AppError('Unauthorized', 401);

//     const parcel = await ParcelRequest.findById(parcelId);
//     if (!parcel) throw new AppError('Parcel not found', 404);

//     if (parcel.senderId.toString() !== senderId) throw new AppError('You are not the owner of this parcel', 403);

//     if (!parcel.deliveryRequests.includes(delivererId)) throw new AppError('Deliverer has not requested this parcel', 400);

//     // Assign the delivery to the chosen deliverer
//     parcel.assignedDelivererId = delivererId;
//     parcel.status = DeliveryStatus.ACCEPTED;
//     parcel.deliveryRequests = []; // Clear requests after assigning
//     await parcel.save();

//     res.status(200).json({ status: 'success', message: 'Deliverer assigned successfully', data: parcel });
//   } catch (error) {
//     next(error);
//   }
// };

// export const requestToDeliver = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { parcelId } = req.body;
//     const userId = req.user?.id;

//     if (!userId) throw new AppError('Unauthorized', 401);

//     const parcel = await ParcelRequest.findById(parcelId);
//     if (!parcel) throw new AppError('Parcel not found', 404);

//     const userObjectId = new mongoose.Types.ObjectId(userId);
    
//     if (parcel.deliveryRequests.includes(userObjectId)) {
//       throw new AppError('You have already requested to deliver this parcel', 400);
//     }

//     parcel.deliveryRequests.push(userObjectId);
//     await parcel.save();

//     res.status(200).json({ status: 'success', message: 'Request sent to deliver the parcel' });
//   } catch (error) {
//     next(error);
//   }
// };



// export const acceptDeliveryRequest = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { parcelId, delivererId } = req.body;
//     const userId = req.user?.id;

//     if (!userId) throw new AppError('Unauthorized', 401);

//     const parcel = await ParcelRequest.findById(parcelId);
//     if (!parcel) throw new AppError('Parcel not found', 404);

//     const delivererObjectId = new mongoose.Types.ObjectId(delivererId);
    
//     if (!parcel.deliveryRequests.includes(delivererObjectId)) {
//       throw new AppError('Deliverer has not requested this parcel', 400);
//     }

//     parcel.assignedDelivererId = delivererObjectId;
//     parcel.status = DeliveryStatus.ACCEPTED;
//     parcel.deliveryRequests = [];
//     await parcel.save();

//     res.status(200).json({ status: 'success', message: 'Deliverer assigned successfully' });
//   } catch (error) {
//     next(error);
//   }
// };

export const requestToDeliver = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { parcelId } = req.body;
    const userId = req.user?.id;

    if (!userId) throw new AppError("Unauthorized", 401);

    // Find the parcel
    const parcel = await ParcelRequest.findById(parcelId);
    if (!parcel) throw new AppError("Parcel not found", 404);

    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Prevent duplicate requests from the same delivery man
    if (parcel.deliveryRequests.includes(userObjectId)) {
      throw new AppError("You have already requested to deliver this parcel", 400);
    }

    // ✅ Add request and update status to "REQUESTED"
    parcel.deliveryRequests.push(userObjectId);
    parcel.status = DeliveryStatus.REQUESTED;
    await parcel.save();

    // ✅ Automatically update the requester's role to `RECEIVER` if they are currently a `SENDER`
    if (user.role === UserRole.SENDER) {
      user.role = UserRole.recciver;
      await user.save();
    }

    res.status(200).json({
      status: "success",
      message: "Request sent to deliver the parcel, and your role has been updated to RECEIVER",
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

//     // ✅ Assign the delivery man and update status to "ACCEPTED"
//     parcel.assignedDelivererId = delivererObjectId;
//     parcel.status = DeliveryStatus.IN_TRANSIT;
//     parcel.deliveryRequests = []; // Clear other requests
//     await parcel.save();
//        // ✅ Automatically update the assigned user's role to `RECEIVER` if they are currently `SENDER`
//        if (delivererId.role === UserRole.SENDER) {
//         delivererId.role = UserRole.recciver;
//         await delivererId.save();
//       }

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

// after assign any reason to cancel deliveryman

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

    // Update parcel status
    parcel.status = status;
    await parcel.save();

    res.status(200).json({ status: 'success', message: `Parcel status updated to ${status}`, data: parcel });
  } catch (error) {
    next(error);
  }
};


//Admin Assign Default all user freeDelivery

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

