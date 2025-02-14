import { AuthRequest } from '../../middlewares/auth';
import { AppError } from '../../middlewares/error';
import { ParcelRequest } from '../../models/ParcelRequest'; 

import { Request, Response, NextFunction } from 'express';
import { DeliveryStatus } from '../../../types/enums';
import mongoose from 'mongoose';




export const requestToDeliver = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { parcelId } = req.body;
    const delivererId = req.user?.id; // Delivery man ID from token

    if (!delivererId) throw new AppError('Unauthorized', 401);

    // Convert delivererId (string) to ObjectId
    const delivererObjectId = new mongoose.Types.ObjectId(delivererId);

    const parcel = await ParcelRequest.findById(parcelId);
    if (!parcel) throw new AppError('Parcel not found', 404);

    if (parcel.assignedDelivererId) throw new AppError('Parcel already assigned to a deliverer', 400);

    // Check if delivererObjectId is already in the deliveryRequests array
    if (parcel.deliveryRequests.some((id) => id.equals(delivererObjectId))) {
      throw new AppError('You have already requested to deliver this parcel', 400);
    }

    // Push ObjectId instead of string
    parcel.deliveryRequests.push(delivererObjectId);
    await parcel.save();

    res.status(200).json({ status: 'success', message: 'Request sent to deliver the parcel' });
  } catch (error) {
    next(error);
  }
};



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
