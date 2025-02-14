
// controllers/parcel.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ParcelRequest } from '../../models/ParcelRequest';
import { User } from '../../models/user.model';
import { AppError } from '../../middlewares/error';
import { DeliveryStatus } from '../../../types/enums';
import { AuthRequest } from '../../middlewares/auth';

// export interface AuthRequest extends Request {
//   user?: { id: string };
// }

// export const createParcelRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const { pickupLocation, deliveryLocation, deliveryType, senderType } = req.body;
//     const senderId = req.user?.id;
//     if (!senderId) throw new AppError('Unauthorized', 401);

//     const sender = await User.findById(senderId);
//     if (!sender) throw new AppError('Sender not found', 404);

//     if (sender.freeDeliveries > 0) {
//       sender.freeDeliveries -= 1;
//       await sender.save();
//     }

//     const parcel = await ParcelRequest.create({
//       senderId,
//       pickupLocation,
//       deliveryLocation,
//       deliveryType,
//       senderType
//     });

//     res.status(201).json({ status: 'success', data: parcel });
//   } catch (error) {
//     next(error);
//   }
// };


export const createParcelRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log("Received Body:", req.body); // 🔍 Debugging Line
    
    const { pickupLocation, deliveryLocation, deliveryType, senderType } = req.body;
    const senderId = req.user?.id;

    if (!senderId) return res.status(401).json({ message: 'Unauthorized' });

    const sender = await User.findById(senderId);
    if (!sender) return res.status(404).json({ message: 'Sender not found' });

    if (!pickupLocation || !deliveryLocation || !deliveryType || !senderType) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (sender.freeDeliveries > 0) {
      sender.freeDeliveries -= 1;
      await sender.save();
    }

    const parcel = await ParcelRequest.create({
      senderId,
      pickupLocation,
      deliveryLocation,
      deliveryType,
      senderType,
    });

    res.status(201).json({ status: 'success', data: parcel });
  } catch (error) {
    console.error("Error Creating Parcel:", error); // 🔍 Debugging Line
    next(error);
  }
};


export const getAvailableParcels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { senderType, pickupLocation, deliveryLocation } = req.query;
    const filter: any = {};
    if (senderType) filter.senderType = senderType;
    if (pickupLocation) filter.pickupLocation = pickupLocation;
    if (deliveryLocation) filter.deliveryLocation = deliveryLocation;

    const parcels = await ParcelRequest.find(filter);
    res.json({ status: 'success', data: parcels });
  } catch (error) {
    next(error);
  }
  
};



// export const getAvailableParcels = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { senderType, pickupLocation, deliveryLocation } = req.query;
//     const userId = req.user?.id; // Get authenticated user ID

//     const filter: any = {};

//     // Publicly available parcels (Only show pending parcels)
//     if (!userId) {
//       filter.status = DeliveryStatus.PENDING;
//     } else {
//       // If authenticated, show:
//       // - Pending parcels (public)
//       // - Requested, accepted, in-transit, or delivered parcels if the user is the sender or assigned deliverer
//       filter.$or = [
//         { status: DeliveryStatus.PENDING }, // Publicly available
//         { senderId: userId }, // Show sender's parcels
//         { assignedDelivererId: userId } // Show deliverer's assigned parcels
//       ];
//     }

//     // Optional filters based on query parameters
//     if (senderType) filter.senderType = senderType;
//     if (pickupLocation) filter.pickupLocation = pickupLocation;
//     if (deliveryLocation) filter.deliveryLocation = deliveryLocation;

//     const parcels = await ParcelRequest.find(filter);
//     res.json({ status: 'success', data: parcels });
//   } catch (error) {
//     next(error);
//   }
// };


export const getParcelWithDeliveryRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { parcelId } = req.params;

    // Find the parcel by its ID
    const parcel = await ParcelRequest.findById(parcelId).populate('deliveryRequests', 'name email'); // Populate deliveryRequests with User details (e.g., name, email)

    if (!parcel) {
      throw new AppError('Parcel not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        parcel,
        deliveryRequests: parcel.deliveryRequests // This will contain the list of users who requested to deliver the parcel
      }
    });
  } catch (error) {
    next(error);
  }
};

