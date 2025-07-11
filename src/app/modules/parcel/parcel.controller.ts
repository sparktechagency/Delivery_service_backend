import { Request, Response, NextFunction } from 'express';
import { ParcelRequest } from './ParcelRequest.model';
import { User } from '../user/user.model';
import { AppError } from '../../middlewares/error';
import { DeliveryStatus, DeliveryType, SenderType, UserRole } from '../../../types/enums';
import { AuthRequest } from '../../middlewares/auth';
import mongoose from 'mongoose';
import upload from "../../../multer/multer"; 
import moment from 'moment';
import axios from 'axios';
import admin from '../../../config/firebase'; 
import { Notification } from '../notification/notification.model';
import  path from 'path';
import fs from 'fs';
import { PhoneNumber } from 'libphonenumber-js';
import { UserDocument } from '../user/user.model';
import { ParcelRequestDocument } from './ParcelRequest.model'; 
import { createNotification, sendPushNotification } from '../notification/notification.controller';
import { Server } from "socket.io"; 
import DeviceToken from '../user/fcm.token.model';
import PushNotification from '../notification/push.notification.model';
let io: Server | null = null;

const getCoordinates = async (location: string) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY; 
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${location}&key=${apiKey}`);
    
    if (response.data.results.length === 0) {
      throw new Error(`No coordinates found for location: ${location}`);
    }
    
    const coordinates = response.data.results[0].geometry.location;
    return { latitude: coordinates.lat, longitude: coordinates.lng };
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    throw new Error('Could not fetch coordinates');
  }
};


export const createParcelRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      pickupLocation,
      deliveryLocation,
      deliveryStartTime,
      deliveryEndTime,
      senderType,
      deliveryType,
      price,
      name,
      phoneNumber,
      title,
      description,
    } = req.body;

    const parcelsDir = path.join(process.cwd(), 'uploads', 'parcels');
    if (!fs.existsSync(parcelsDir)) {
      fs.mkdirSync(parcelsDir, { recursive: true });
    }

    let images: string[] = [];
    if (req.files && typeof req.files === 'object') {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files.image && Array.isArray(files.image)) {
        images = files.image.map((file: Express.Multer.File) => `/uploads/image/${file.filename}`);
      }
    }

    const pickupCoordinates = await getCoordinates(pickupLocation);
    const deliveryCoordinates = await getCoordinates(deliveryLocation);

    const parcel = await ParcelRequest.create({
      senderId: req.user?.id,
      pickupLocation: {
        type: 'Point',
        coordinates: [pickupCoordinates.longitude, pickupCoordinates.latitude],
      },
      deliveryLocation: {
        type: 'Point',
        coordinates: [deliveryCoordinates.longitude, deliveryCoordinates.latitude],
      },
      deliveryStartTime,
      deliveryEndTime,
      senderType,
      deliveryType,
      price,
      title,
      description,
      images,
      name,
      phoneNumber,
      status: 'PENDING',
    });

    // Update sender's record 
    await User.findByIdAndUpdate(req.user?.id, {
      $push: {
        SendOrders: {
          parcelId: parcel._id,
          type: 'send_parcel',
          pickupLocation,
          deliveryLocation,
          price,
          title,
          phoneNumber,
          description,
          senderType,
          deliveryType,
          deliveryStartTime,
          deliveryEndTime,
        },
      },
      $inc: { totalSentParcels: 1, totalOrders: 1 },
    });

    // Get sender info
    const sender = await User.findById(req.user?.id).select('fullName');
    if (!sender) throw new Error('Sender not found');
  
    //specific user obly notify
    const usersToNotify = await User.find({
      isVerified: true,
      _id: { $ne: req.user?.id },
      notificationStatus: true
    }).select('_id');

    const userIds = usersToNotify.map(user => user._id.toString());

    const fcmTokens = await DeviceToken.find({
      userId: { $in: userIds },
      fcmToken: { $exists: true, $ne: '' }
    }).select('fcmToken userId');

    // ✅ Compose message
      const notificationMessage = `A new parcel "${title}" created by "${sender.fullName}".`;
    const pushPayload = {
      notification: {
        title: `${parcel.title}`,
        body: notificationMessage,
      },
      data: {
        type: 'send_parcel',
        title,
        message: notificationMessage,
        parcelId: parcel._id.toString(),
        price: String(price),
        description: description || '',
        phoneNumber: phoneNumber || '',
        deliveryStartTime,
        deliveryEndTime,
      },
    };


for (const token of fcmTokens) {
  try {
    await admin.messaging().send({
      ...pushPayload,
      token: token.fcmToken,
    });
    console.log(`✅ Sent push to ${token.fcmToken}`);
  } catch (err: any) {
    console.error(`❌ Push failed to ${token.fcmToken}:`, err);

    // Remove invalid tokens automatically
    if (
      err.code === 'messaging/registration-token-not-registered' ||
      err.code === 'messaging/mismatched-credential'
    ) {
      await DeviceToken.deleteOne({ fcmToken: token.fcmToken });
      console.log(`🗑️ Removed invalid token: ${token.fcmToken}`);
    }
  }
}


    for (const userId of userIds) {
  try {
    await Notification.create({
      userId: new mongoose.Types.ObjectId(userId),
      message: notificationMessage,
      type: 'send_parcel',
      title,
      parcelId: parcel._id,
      price,
      phoneNumber,
      description,
      deliveryStartTime,
      deliveryEndTime,
      pickupLocation: {
        latitude: pickupCoordinates.latitude,
        longitude: pickupCoordinates.longitude,
      },
      deliveryLocation: {
        latitude: deliveryCoordinates.latitude,
        longitude: deliveryCoordinates.longitude,
      },
      isRead: false,
      createdAt: new Date(),
       localCreatedAt: moment().tz('Asia/Dhaka').format('YYYY-MM-DD hh:mm A')
    });
  } catch (err) {
    console.error('Error saving notification for user:', userId, err);
  }
}
  
    console.log(`🔔 Notifications sent to ${userIds.length} users`);

    const fullParcel = await ParcelRequest.findById(parcel._id)
    .populate('senderId', 'fullName email mobileNumber name phoneNumber profileImage')
    

     res.status(201).json({
      status: 'success',
      data: fullParcel,
    });
  } catch (error) {
    console.error('❌ Error in createParcelRequest:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create parcel request',
    });
    return;
  }
};


export const deleteParcelRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> =>{
  try {
    const { parcelId } = req.params;
    
    const parcel = await ParcelRequest.findById(parcelId);
    
    if (!parcel) {
       res.status(404).json({
        status: 'error',
        message: 'Parcel not found',
      });
      return;
    }

    if (parcel.status === 'IN_TRANSIT' || parcel.status === 'DELIVERED') {
       res.status(400).json({
        status: 'error',
        message: 'Your parcel is already in transit or delivered. Please remove the delivery man first before deleting the parcel.',
      });
    }

    if (parcel.status === 'PENDING' || parcel.status === 'REQUESTED') {
      await ParcelRequest.findByIdAndDelete(parcelId);

      await User.findByIdAndUpdate(parcel.senderId, {
        $pull: { SendOrders: { parcelId } },
        $inc: { totalSentParcels: -1, totalOrders: -1 }
      });

    res.status(200).json({
        status: 'success',
        message: 'Parcel deleted successfully',
      });
    } else {
       res.status(400).json({
        status: 'error',
        message: 'Cannot delete the parcel as its status is not pending or requested.',
      });
    }
  } catch (error) {
    console.error('Error deleting parcel:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete parcel request',
    });
    next(error);
  }
};

export const getAvailableParcels = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.id) {
      return next(new AppError("Unauthorized", 401));
    }
    const userId = req.user.id;
    
    let parcels = await ParcelRequest.find({
      status: DeliveryStatus.PENDING,
    })
    .select('title description pickupLocation deliveryLocation deliveryStartTime deliveryEndTime deliveryType senderType status deliveryRequests name price phoneNumber createdAt updatedAt images') 
    .populate("senderId", "fullName email mobileNumber profileImage role")
    .sort({ createdAt: -1 });

    // Filter out parcels with null senderId AND current user's parcels
    parcels = parcels.filter(parcel => {
      // Check if senderId exists and is populated
      if (!parcel.senderId || !parcel.senderId._id) {
        return false; // Exclude parcels with null/missing senderId
      }
      
      // Exclude current user's parcels
      return parcel.senderId._id.toString() !== userId.toString();
    });

    const reorderedParcels = parcels.map(parcel => {
      const { _id, ...rest } = parcel.toObject() as any;
      return { _id, ...rest, isRequestedByMe: false };
    });

    res.status(200).json({
      status: "success",
      data: reorderedParcels,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserParcels = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);
    let parcels;
    if (req.user && req.user.role === UserRole.SENDER) {
      parcels = await ParcelRequest.find({
        assignedDelivererId: userId,
      })
        .populate("senderId", "fullName email mobileNumber phoneNumber image avgRating role")
        .populate("assignedDelivererId", "fullName email mobileNumber image avgRating role")
        .populate("deliveryRequests", "fullName email mobileNumber image avgRating role")
        .sort({ createdAt: -1 })
        .lean();
    } else {
      parcels = await ParcelRequest.find({
        senderId: userId,
      })
        .populate("senderId", "fullName email mobileNumber phoneNumber reviews avgRating image role")
        .populate("assignedDelivererId", "fullName email mobileNumber image reviews avgRating role")
        .populate("deliveryRequests", "fullName email mobileNumber image reviews avgRating role")
        .sort({ createdAt: -1 })  
        .lean();
    }
    if (parcels && parcels.length > 0) {
      parcels = parcels.map(parcel => {
        // Handle sender mobile number
        if (parcel.senderId && typeof parcel.senderId === 'object' && parcel.senderId !== null) {
          // Check if it's a populated user object by looking for common user properties
          if ('email' in parcel.senderId) {
            // Check for mobileNumber first, then phoneNumber
            const mobileNumber = 
              ('mobileNumber' in parcel.senderId ? parcel.senderId.mobileNumber : null) || 
              ('phoneNumber' in parcel.senderId ? parcel.senderId.phoneNumber : null) || 
              "";
            
            // Set the mobileNumber
            (parcel.senderId as any).mobileNumber = mobileNumber;
          }
        }
        
        // Slice the deliveryRequests array to the first 5 requests only
        if (parcel.deliveryRequests && parcel.deliveryRequests.length > 5) {
          parcel.deliveryRequests = parcel.deliveryRequests.slice(0, 5);
        }
        return parcel;
      });
    }
    res.status(200).json({
      status: "success",
      data: parcels,  
    });
  } catch (error) {
    next(error);  
  }
};

// Controller to show parcels requested by the user and those assigned to them
export const getAssignedAndRequestedParcels = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    // Parcels where the user has requested to deliver
    const requestedParcels = await ParcelRequest.find({
      deliveryRequests: userId, // User has requested to deliver this parcel
      status: { $ne: DeliveryStatus.DELIVERED } // Exclude completed parcels
    })
      .populate("senderId", "fullName email mobileNumber phoneNumber image avgRating role")
      .populate("assignedDelivererId", "fullName email mobileNumber image avgRating role")
      .populate("deliveryRequests", "fullName email mobileNumber image avgRating role")
      .sort({ createdAt: -1 })
      .lean();

    // Parcels where the user has been assigned as the deliverer
    const assignedParcels = await ParcelRequest.find({
      assignedDelivererId: userId, // User is the assigned deliverer for this parcel
      status: { $ne: DeliveryStatus.DELIVERED } // Exclude completed parcels
    })
      .populate("senderId", "fullName email mobileNumber phoneNumber image avgRating role")
      .populate("assignedDelivererId", "fullName email mobileNumber image avgRating role")
      .populate("deliveryRequests", "fullName email mobileNumber image avgRating role")
      .sort({ createdAt: -1 })
      .lean();

    // Combine both requested and assigned parcels into one response
    const allParcels = [...requestedParcels, ...assignedParcels];

    // Modify parcels as needed, for example, set the mobile number for the sender if missing
    const parcels = allParcels.map(parcel => {
      if (parcel.senderId && typeof parcel.senderId === 'object' && parcel.senderId !== null) {
        if ('email' in parcel.senderId) {
          const mobileNumber = 
            ('mobileNumber' in parcel.senderId ? parcel.senderId.mobileNumber : null) || 
            ('phoneNumber' in parcel.senderId ? parcel.senderId.phoneNumber : null) || 
            "";
          
          (parcel.senderId as any).mobileNumber = mobileNumber;
        }
      }

      // Slice the deliveryRequests array to the first 5 requests only
      if (parcel.deliveryRequests && parcel.deliveryRequests.length > 5) {
        parcel.deliveryRequests = parcel.deliveryRequests.slice(0, 5);
      }

      return parcel;
    });

    res.status(200).json({
      status: "success",
      data: parcels,  
    });
  } catch (error) {
    next(error);
  }
};

// export const getUserSendAndDeliveryRequestParcels = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) throw new AppError("Unauthorized", 401);

//     // Parcels where user is the sender (sendParcel)
//     const sendParcels = await ParcelRequest.find({ senderId: userId })
//       .populate("senderId", "fullName email mobileNumber phoneNumber averageRating reviews role image")
//       .populate("assignedDelivererId", "fullName email mobileNumber phoneNumber averageRating reviews role image")
//       .populate("deliveryRequests", "fullName email mobileNumber phoneNumber averageRating reviews role image")
//       .sort({ createdAt: -1 }) // Sort by the most recent parcel
//       .lean();

//     sendParcels.forEach(p => ((p as any).typeParcel = "sendParcel"));

//     // Parcels where user requested delivery (deliveryRequest)
//     const deliveryRequestParcels = await ParcelRequest.find({
//       deliveryRequests: userId,  
//       senderId: { $ne: userId },
//       status: { $in: ['PENDING', 'REQUESTED'] }, // Only available parcels
//     })
//       .populate("senderId", "fullName email mobileNumber phoneNumber role avgRating reviews image")
//       .populate("assignedDelivererId", "fullName email mobileNumber avgRating reviews role image")
//       .populate("deliveryRequests", "fullName email mobileNumber avgRating reviews role image")
//       .sort({ createdAt: -1 }) // Sort by the most recent delivery request
//       .lean();

//     deliveryRequestParcels.forEach(p => ((p as any).typeParcel = "deliveryRequest"));

//     const assignedParcels = await ParcelRequest.find({
//       assignedDelivererId: userId,
//       status: { $ne: 'DELIVERED' }, 
//     })
//       .populate("senderId", "fullName email mobileNumber phoneNumber avgRating reviews role image")
//       .populate("assignedDelivererId", "fullName email mobileNumber avgRating reviews role image")
//       .populate("deliveryRequests", "fullName email mobileNumber avgRating reviews role image")
//       .sort({ createdAt: -1 })
//       .lean();

//     assignedParcels.forEach(p => ((p as any).typeParcel = "assignedParcel"));

//     const parcels = [
//       ...sendParcels,
//       ...deliveryRequestParcels,
//       ...assignedParcels
//     ].map(parcel => {
//       // Fallback for sender mobile number
//       if (parcel.senderId && typeof parcel.senderId === "object" && parcel.senderId !== null) {
//         if ("email" in parcel.senderId) {
//           const mobileNumber =
//             ("mobileNumber" in parcel.senderId ? parcel.senderId.mobileNumber : null) ||
//             ("phoneNumber" in parcel.senderId ? parcel.senderId.phoneNumber : null) ||
//             "";
//           (parcel.senderId as any).mobileNumber = mobileNumber;
//         }
//       }

//       // Limit deliveryRequests array length to 5 max
//       if (parcel.deliveryRequests && parcel.deliveryRequests.length > 5) {
//         parcel.deliveryRequests = parcel.deliveryRequests.slice(0, 5);
//       }

//       return parcel;
//     });

//     // Sort combined parcels to ensure the latest is at the top (sort by createdAt in descending order)
//     parcels.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

//     res.status(200).json({
//       status: "success",
//       data: parcels,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
export const getUserSendAndDeliveryRequestParcels = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    // Parcels where user is the sender (sendParcel)
    const sendParcels = await ParcelRequest.find({ senderId: userId })
      .populate("senderId", "fullName email mobileNumber phoneNumber averageRating reviews role image")
      .populate("assignedDelivererId", "fullName email mobileNumber phoneNumber averageRating reviews role image")
      .populate("deliveryRequests", "fullName email mobileNumber phoneNumber averageRating reviews role image")
      .sort({ createdAt: -1 })
      .lean();

    sendParcels.forEach(p => ((p as any).typeParcel = "sendParcel"));

    // Parcels where user requested delivery (deliveryRequest)
    const deliveryRequestParcels = await ParcelRequest.find({
      deliveryRequests: userId,
      senderId: { $ne: userId },
      status: { $in: ['PENDING', 'REQUESTED'] },
    })
      .populate("senderId", "fullName email mobileNumber phoneNumber role averageRating reviews image")
      .populate("assignedDelivererId", "fullName email mobileNumber averageRating reviews role image")
      .populate("deliveryRequests", "fullName email mobileNumber averageRating reviews role image")
      .sort({ createdAt: -1 })
      .lean();

    deliveryRequestParcels.forEach(p => ((p as any).typeParcel = "deliveryRequest"));

    const assignedParcels = await ParcelRequest.find({
      assignedDelivererId: userId,
      status: { $ne: 'DELIVERED' },
    })
      .populate("senderId", "fullName email mobileNumber phoneNumber averageRating reviews role image")
      .populate("assignedDelivererId", "fullName email mobileNumber averageRating reviews role image")
      .populate("deliveryRequests", "fullName email mobileNumber averageRating reviews role image")
      .sort({ createdAt: -1 })
      .lean();

    assignedParcels.forEach(p => ((p as any).typeParcel = "assignedParcel"));

    const parcels = [
      ...sendParcels,
      ...deliveryRequestParcels,
      ...assignedParcels
    ].map(parcel => {
      // Fallback for sender mobile number
      if (
        parcel.senderId &&
        typeof parcel.senderId === "object" &&
        !('toHexString' in parcel.senderId) // Not an ObjectId
      ) {
        const mobileNumber =
          (parcel.senderId as any).mobileNumber ||
          (parcel.senderId as any).phoneNumber ||
          "";
        (parcel.senderId as any).mobileNumber = mobileNumber;

        if ((parcel.senderId as any).averageRating !== undefined) {
          (parcel.senderId as any).averageRating = parseFloat((parcel.senderId as any).averageRating).toFixed(2);
        }
      }

      // Format assignedDelivererId averageRating
      if (
        parcel.assignedDelivererId &&
        typeof parcel.assignedDelivererId === "object" &&
        !('toHexString' in parcel.assignedDelivererId)
      ) {
        if ((parcel.assignedDelivererId as any).averageRating !== undefined) {
          (parcel.assignedDelivererId as any).averageRating = parseFloat((parcel.assignedDelivererId as any).averageRating).toFixed(2);
        }
      }

      // Limit deliveryRequests to 5 and format their averageRating
      if (Array.isArray(parcel.deliveryRequests)) {
        // Create a new array for mapped deliveryRequests with formatted averageRating, do not mutate the original type
        const mappedDeliveryRequests = parcel.deliveryRequests.slice(0, 5).map(user => {
          if (
            user &&
            typeof user === "object" &&
            "averageRating" in user &&
            !('toHexString' in user)
          ) {
            return {
              ...(typeof user === "object" && user !== null ? user : {}),
              averageRating: parseFloat((user as any).averageRating).toFixed(2),
            };
          }
          return user;
        });
        // Optionally attach as a new property for the response
        (parcel as any).deliveryRequestsWithRating = mappedDeliveryRequests;
      }

      return parcel;
    });

    // Final sort by createdAt (descending)
    parcels.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.status(200).json({
      status: "success",
      data: parcels,
    });
  } catch (error) {
    next(error);
  }
};

export const getParcelsByRadius = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude, radius, status } = req.body;

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
      throw new AppError('Latitude, longitude, and radius must be valid numbers', 400);
    }

    console.log(`Searching for parcels within ${radius} km of lat: ${latitude}, lon: ${longitude}`);

    const radiusInRadians = radius / 6371;

    const filter: any = {
      'pickupLocation.coordinates': {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radiusInRadians], 
        },
      },
      status: DeliveryStatus.PENDING, 
    };
    if (status && Object.values(DeliveryStatus).includes(status)) {
      filter.status = status;
    }

    // Exclude parcels created by the logged-in user
    if (req.user?.id) {
      filter.senderId = { $ne: req.user.id }; //avoid the user from seeing their own parcels
    }

    const parcels = await ParcelRequest.find(filter)
      .populate('senderId', 'fullName') 
      .lean();

    if (parcels.length === 0) {
      console.log('No parcels found within the specified radius.');
    } else {
      console.log(`Found ${parcels.length} parcels within the specified radius.`);
    }
    parcels.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({
      status: 'success',
      data: parcels,
    });
  } catch (error) {
    next(error);
  }
};

export const getParcelWithDeliveryRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { parcelId } = req.params;

    const parcel = await ParcelRequest.findById(parcelId).populate('deliveryRequests', 'name email'); // Populate deliveryRequests with User details (e.g., name, email)

    if (!parcel) {
      throw new AppError('Parcel not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        parcel,
        deliveryRequests: parcel.deliveryRequests 
      }
    });
  } catch (error) {
    next(error);
  }
};

// export const updateParcelStatus = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { parcelId, status, rating, review } = req.body;

//     if (!parcelId || !status) {
//       throw new AppError("Parcel ID and status are required", 400);
//     }

//     // Validate status
//     const validStatuses = [
//       DeliveryStatus.REQUESTED,
//       DeliveryStatus.ACCEPTED,
//       DeliveryStatus.IN_TRANSIT,
//       DeliveryStatus.DELIVERED
//     ];

//     if (!validStatuses.includes(status)) {
//       throw new AppError(`Invalid status. Allowed values: ${validStatuses.join(", ")}`, 400);
//     }

//     // Find the parcel
//     const parcel = await ParcelRequest.findById(parcelId);
//     if (!parcel) {
//       throw new AppError("Parcel not found", 404);
//     }

//     // Check if user is authorized to update status
//     const userId = req.user?.id;
//     if (!userId) throw new AppError("Unauthorized", 401);

//     if (status === DeliveryStatus.DELIVERED) {
//       // Handle rating and review only when the parcel is delivered
//       if (rating && (rating < 1 || rating > 5)) {
//         throw new AppError("Rating must be between 1 and 5", 400);
//       }

//       if (review && review.trim().length > 500) {
//         throw new AppError("Review text cannot exceed 500 characters", 400);
//       }

//       // Find the sender and receiver users
//       const sender = await User.findById(parcel.senderId);
//       const receiver = await User.findById(parcel.receiverId);

//       if (!sender || !receiver) {
//         throw new AppError("Sender or Receiver not found", 404);
//       }

//       // Add the rating and review to both sender's and receiver's profiles
//       if (rating && review) {
//         // Update the sender's profile with the review and rating
//         sender.reviews.push({
//           parcelId: parcel._id,
//           rating,
//           review
//         });
//         await sender.save();

//         // Update the receiver's profile with the review and rating
//         receiver.reviews.push({
//           parcelId: parcel._id,
//           rating,
//           review
//         });
//         await receiver.save();
//       }

//       // Set the parcel status to 'DELIVERED'
//       parcel.status = DeliveryStatus.DELIVERED;
//     }

//     await parcel.save();

//     res.status(200).json({
//       status: "success",
//       message: `Parcel status updated to ${status}`,
//       data: parcel,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

 // To handle date comparison more easily

export const updateParcelStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { parcelId, status, rating, review } = req.body;

    if (!parcelId || !status) {
      throw new AppError("Parcel ID and status are required", 400);
    }

    const validStatuses = [
      DeliveryStatus.REQUESTED,
      DeliveryStatus.IN_TRANSIT,
      DeliveryStatus.DELIVERED
    ];

    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status. Allowed values: ${validStatuses.join(", ")}`, 400);
    }

    const parcel = await ParcelRequest.findById(parcelId);
    if (!parcel) {
      throw new AppError("Parcel not found", 404);
    }

    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    if (status === DeliveryStatus.DELIVERED) {
      if (rating && (rating < 1 || rating > 5)) {
        throw new AppError("Rating must be between 1 and 5", 400);
      }

      if (review && review.trim().length > 500) {
        throw new AppError("Review text cannot exceed 500 characters", 400);
      }

      //new
      if (status === DeliveryStatus.DELIVERED) {
        await User.findByIdAndUpdate(parcel.senderId, {
          $inc: {
            totalDelivered: 1,
            totalAmountSpent: parcel.price
          }
        });
        
        const delivererId = parcel.assignedDelivererId;
        await User.findByIdAndUpdate(delivererId, {
          $inc: {
            TotaltripsCompleted: 1,
            totalEarning: parcel.price,
            monthlyEarnings: parcel.price
          }
        });
      }
    parcel.status = status;
    await parcel.save();
    const sender = await User.findById(parcel.senderId);
    const receiver = await User.findById(parcel.receiverId);

  console.log(`Sender ID: ${parcel.senderId}, Receiver ID: ${parcel.receiverId}`);

  if (!sender || !receiver) {
  throw new AppError("Sender or Receiver not found", 404);
  }
  

      // Add the rating and review to both sender's and receiver's profiles
      if (rating && review) {
        // Update the sender's profile with the review and rating
        sender.reviews.push({
          parcelId: parcel._id,
          rating,
          review
        });
        await sender.save();

        // Update the receiver's profile with the review and rating
        receiver.reviews.push({
          parcelId: parcel._id,
          rating,
          review
        });
        await receiver.save();
      }

      parcel.status = DeliveryStatus.DELIVERED;

      receiver.totalReceivedParcels += 1;

      const today = moment().startOf('day');
      const deliveredDate = moment(parcel.updatedAt);

      if (deliveredDate.isSame(today, 'day')) {
        // If delivered today, increment the tripsPerDay count
        receiver.tripsPerDay += 1;
      }

      await receiver.save();
    }

    await parcel.save();
    console.log("Parcel Data:", parcel);

    res.status(200).json({
      status: "success",
      message: `Parcel status updated to ${status}`,
      data: parcel,
    });
  } catch (error) {
    next(error);
  }
};



export const getUserReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const reviews = user.reviews;

    if (reviews.length === 0) {
       res.status(200).json({
        status: "success",
        message: "No reviews found",
        data: [],
      });
    }

    res.status(200).json({
      status: "success",
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};




// export const getFilteredParcels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   try {
//     // Debugging: Check the user ID
//     console.log("Logged-in user ID:", req.user?.id);

//     const { latitude, longitude, radius = 15, deliveryType } = req.query;

//     const lat = parseFloat(latitude as string);
//     const lng = parseFloat(longitude as string);

//     // ✅ FIXED: Added return statements to prevent multiple responses
//     if (isNaN(lat)) {
//        res.status(400).json({
//         status: 'error',
//         message: 'Invalid latitude value. Please provide a valid number for latitude.',
//       });
//       return;
//     }

//     if (isNaN(lng)) {
//        res.status(400).json({
//         status: 'error',
//         message: 'Invalid longitude value. Please provide a valid number for longitude.',
//       });
//       return;
//     }

//     console.log(`Searching for parcels within ${radius} km of lat: ${lat}, lon: ${lng}`);

//     const maxDistance = parseFloat(radius as string) * 1000;

//     const nearbyPickupQuery: any = {
//       status: DeliveryStatus.PENDING,
//       pickupLocation: {
//         $nearSphere: {
//           $geometry: { type: 'Point', coordinates: [lng, lat] },
//           $maxDistance: maxDistance,
//         },
//       },
//       senderId: { $ne: req.user?.id }, // Exclude parcels owned by the logged-in user
//     };

//     const nearbyDeliveryQuery: any = {
//       status: DeliveryStatus.PENDING,
//       deliveryLocation: {
//         $nearSphere: {
//           $geometry: { type: 'Point', coordinates: [lng, lat] },
//           $maxDistance: maxDistance,
//         },
//       },
//       senderId: { $ne: req.user?.id }, 
//     };

//     // Delivery type mapping based on selected delivery type
//     const deliveryTypeMapping: { [key: string]: string[] } = {
//       [DeliveryType.PERSON]: [DeliveryType.PERSON, DeliveryType.BICYCLE, DeliveryType.BIKE],
//       [DeliveryType.BICYCLE]: [DeliveryType.PERSON, DeliveryType.BICYCLE, DeliveryType.BIKE],
//       [DeliveryType.BIKE]: [DeliveryType.PERSON, DeliveryType.BICYCLE, DeliveryType.BIKE, DeliveryType.CAR],
//       [DeliveryType.CAR]: [DeliveryType.PERSON, DeliveryType.BICYCLE, DeliveryType.BIKE, DeliveryType.CAR],
//       [DeliveryType.TAXI]: [DeliveryType.PERSON, DeliveryType.BICYCLE, DeliveryType.BIKE, DeliveryType.CAR, DeliveryType.TAXI],
//       [DeliveryType.TRUCK]: [DeliveryType.PERSON, DeliveryType.BICYCLE, DeliveryType.BIKE, DeliveryType.CAR, DeliveryType.TRUCK],
//       [DeliveryType.AIRPLANE]: [DeliveryType.AIRPLANE],
//     };

//     // ✅ FIXED: Added return statement for invalid delivery type
//     if (deliveryType && Object.values(DeliveryType).includes(deliveryType as DeliveryType)) {
//       const validTypes = deliveryTypeMapping[deliveryType as string];
//       if (validTypes) {
//         nearbyPickupQuery.deliveryType = { $in: validTypes };
//         nearbyDeliveryQuery.deliveryType = { $in: validTypes };
//       }
//     } else if (deliveryType) {
//        res.status(400).json({
//         status: 'error',
//         message: `Invalid delivery type: ${deliveryType}. Please select a valid delivery type.`,
//       });
//       return;
//     }

//     // ✅ IMPROVED: Execute both queries in parallel for better performance
//     const [nearbyPickupParcels, nearbyDeliveryParcels] = await Promise.all([
//       ParcelRequest.find(nearbyPickupQuery)
//         .select('title price description pickupLocation deliveryLocation deliveryStartTime deliveryEndTime deliveryType status name phoneNumber images') 
//         .populate("senderId", "fullName email mobileNumber phoneNumber image avgRating role")
//         .lean(),
      
//       ParcelRequest.find(nearbyDeliveryQuery)
//         .select('title price description pickupLocation deliveryLocation deliveryStartTime deliveryEndTime deliveryType status name phoneNumber images') 
//         .populate("senderId", "fullName email mobileNumber phoneNumber image avgRating role")
//         .lean()
//     ]);

//     // ✅ IMPROVED: Remove duplicates by converting to Set using _id
//     const allNearbyParcels = [
//       ...nearbyPickupParcels,
//       ...nearbyDeliveryParcels.filter(
//         deliveryParcel => !nearbyPickupParcels.some(
//           pickupParcel => pickupParcel._id.toString() === deliveryParcel._id.toString()
//         )
//       )
//     ];

//     // ✅ FIXED: Added return statement for no results
//     if (allNearbyParcels.length === 0) {
//        res.status(404).json({
//         status: 'error',
//         message: `No parcels found within ${radius}km radius${deliveryType ? ` with delivery type: ${deliveryType}` : ''}.`,
//       });
//       return;
//     }

//     // ✅ IMPROVED: Enhanced response with metadata
//      res.status(200).json({
//       status: 'success',
//       message: `Found ${allNearbyParcels.length} parcel(s) within ${radius}km radius.`,
//       data: {
//         parcels: allNearbyParcels,
//         total: allNearbyParcels.length,
//         filters: {
//           latitude: lat,
//           longitude: lng,
//           radius: `${radius}km`,
//           deliveryType: deliveryType || 'all',
//           excludedSender: req.user?.id
//         }
//       }
//     });
//     return;

//   } catch (error) {
//     console.error('Error fetching parcels:', error);
    
//     // ✅ IMPROVED: Better error handling with specific error messages
//     if (typeof error === 'object' && error !== null && 'name' in error && (error as any).name === 'CastError') {
//        res.status(400).json({
//         status: 'error',
//         message: 'Invalid query parameters provided.',
//       });
//       return;
//     }
    
//     if (typeof error === 'object' && error !== null && 'message' in error && (error as any).message?.includes('$nearSphere')) {
//        res.status(400).json({
//         status: 'error',
//         message: 'Location search failed. Please check your coordinates.',
//       });
//       return;
//     }

//     next(error);
//   }
// };
export const getFilteredParcels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log("Logged-in user ID:", req.user?.id);

    const {
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng,
      radius = 15,
      deliveryType
    } = req.query;

    const pickupLatitude = parseFloat(pickupLat as string);
    const pickupLongitude = parseFloat(pickupLng as string);
    const deliveryLatitude = parseFloat(deliveryLat as string);
    const deliveryLongitude = parseFloat(deliveryLng as string);

    const maxDistance = parseFloat(radius as string) * 1000;

    // Validation
    if (isNaN(pickupLatitude) || isNaN(pickupLongitude)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid pickup coordinates. Please provide valid pickupLat and pickupLng.',
      });
      return;
    }

    if (isNaN(deliveryLatitude) || isNaN(deliveryLongitude)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid delivery coordinates. Please provide valid deliveryLat and deliveryLng.',
      });
      return;
    }

    console.log(`Searching for parcels with pickup near (${pickupLatitude}, ${pickupLongitude}) and delivery near (${deliveryLatitude}, ${deliveryLongitude}) within ${radius} km.`);

    // Delivery type mapping
    const deliveryTypeMapping: { [key: string]: string[] } = {
      [DeliveryType.PERSON]: [DeliveryType.PERSON, DeliveryType.BICYCLE, DeliveryType.BIKE],
      [DeliveryType.BICYCLE]: [DeliveryType.PERSON, DeliveryType.BICYCLE, DeliveryType.BIKE],
      [DeliveryType.BIKE]: [DeliveryType.PERSON, DeliveryType.BICYCLE, DeliveryType.BIKE, DeliveryType.CAR],
      [DeliveryType.CAR]: [DeliveryType.PERSON, DeliveryType.BICYCLE, DeliveryType.BIKE, DeliveryType.CAR],
      [DeliveryType.TAXI]: [DeliveryType.PERSON, DeliveryType.BICYCLE, DeliveryType.BIKE, DeliveryType.CAR, DeliveryType.TAXI],
      [DeliveryType.TRUCK]: [DeliveryType.PERSON, DeliveryType.BICYCLE, DeliveryType.BIKE, DeliveryType.CAR, DeliveryType.TRUCK],
      [DeliveryType.AIRPLANE]: [DeliveryType.AIRPLANE],
    };

    const baseQuery: any = {
      status: DeliveryStatus.PENDING,
      pickupLocation: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [pickupLongitude, pickupLatitude] },
          $maxDistance: maxDistance,
        },
      },
      deliveryLocation: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [deliveryLongitude, deliveryLatitude] },
          $maxDistance: maxDistance,
        },
      },
      senderId: { $ne: req.user?.id },
    };

    if (deliveryType && Object.values(DeliveryType).includes(deliveryType as DeliveryType)) {
      const validTypes = deliveryTypeMapping[deliveryType as string];
      baseQuery.deliveryType = { $in: validTypes };
    } else if (deliveryType) {
      res.status(400).json({
        status: 'error',
        message: `Invalid delivery type: ${deliveryType}. Please select a valid delivery type.`,
      });
      return;
    }

    const matchedParcels = await ParcelRequest.find(baseQuery)
      .select('title price description pickupLocation deliveryLocation deliveryStartTime deliveryEndTime deliveryType status name phoneNumber images')
      .populate("senderId", "fullName email mobileNumber phoneNumber image avgRating role")
      .lean();

    if (matchedParcels.length === 0) {
      res.status(404).json({
        status: 'error',
        message: `No parcels found with pickup within ${radius}km of the specified pickup location AND delivery within ${radius}km of the specified delivery location.`,
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: `Found ${matchedParcels.length} parcel(s) matching both pickup and delivery location within ${radius}km radius.`,
      data: {
        parcels: matchedParcels,
        total: matchedParcels.length,
        filters: {
          pickupLat: pickupLatitude,
          pickupLng: pickupLongitude,
          deliveryLat: deliveryLatitude,
          deliveryLng: deliveryLongitude,
          radius: `${radius}km`,
          deliveryType: deliveryType || 'all',
          excludedSender: req.user?.id
        }
      }
    });
    return;

  } catch (error) {
    console.error('Error fetching parcels:', error);

    if (typeof error === 'object' && error !== null && 'name' in error && (error as any).name === 'CastError') {
      res.status(400).json({
        status: 'error',
        message: 'Invalid query parameters provided.',
      });
      return;
    }

    if (typeof error === 'object' && error !== null && 'message' in error && (error as any).message?.includes('$nearSphere')) {
      res.status(400).json({
        status: 'error',
        message: 'Location search failed. Please check your coordinates.',
      });
      return;
    }

    next(error);
  }
};





