
// controllers/parcel.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ParcelRequest } from './ParcelRequest.model';
import { User } from '../user/user.model';
import { AppError } from '../../middlewares/error';
import { DeliveryStatus, SenderType, UserRole } from '../../../types/enums';
import { AuthRequest } from '../../middlewares/auth';
import mongoose from 'mongoose';
import upload from "../../../multer/multer"; // ✅ Import multer configuration


// export const createParcelRequest = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     console.log("🔄 createParcelRequest called");
//     console.log("📄 Request body:", JSON.stringify(req.body, null, 2));
//     console.log("📄 Request files:", req.files);
    
//     // Handle file upload with Multer
//     let images: string[] = [];
//     if (req.files && Array.isArray(req.files)) {
//       // For debugging
//       console.log(`📸 Received ${(req.files as Express.Multer.File[]).length} files`);
//       (req.files as Express.Multer.File[]).forEach((file, index) => {
//         console.log(`📸 File ${index + 1}:`, file.filename, file.path);
//       });
      
//       // Store URLs instead of just filenames for better frontend accessibility
//       images = (req.files as Express.Multer.File[]).map(file => `/uploads/parcels/${file.filename}`);
//       console.log("📸 Processed image paths:", images);
//     } else {
//       console.log("⚠️ No files received in request");
//     }

//     // Ensure the required fields are properly extracted
//     const {
//       pickupLocation,
//       deliveryLocation,
//       deliveryStartTime,
//       deliveryEndTime,
//       senderType,
//       deliveryType,
//       price,
//       receiverDetails,
//       title,
//       description,
//     } = req.body;

//     const userId = req.user?.id;
//     if (!userId) {
//       console.log("❌ No user ID found in request");
//       throw new AppError("Unauthorized", 401);
//     }
    
//     console.log("👤 User ID:", userId);

//     // Validate required fields
//     if (!pickupLocation || !deliveryLocation || !deliveryStartTime || !deliveryEndTime || !senderType || !deliveryType || !price || !receiverDetails) {
//       console.log("❌ Missing required fields");
//       throw new AppError("All fields are required", 400);
//     }

//     // Validate senderType from enum
//     if (!Object.values(SenderType).includes(senderType as SenderType)) {
//       console.log("❌ Invalid senderType:", senderType);
//       throw new AppError(`Invalid senderType. Allowed values: ${Object.values(SenderType).join(", ")}`, 400);
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       console.log("❌ User not found with ID:", userId);
//       throw new AppError("User not found", 404);
//     }
    
//     console.log("👤 Found user:", user.email || user.fullName);

//     if (user.freeDeliveries > 0) {
//       user.freeDeliveries -= 1;
//       await user.save();
//       console.log("🎫 Used a free delivery. Remaining:", user.freeDeliveries);
//     }

//     // Parse `receiverDetails` from JSON if it's a string
//     let parsedReceiverDetails;
//     try {
//       parsedReceiverDetails = typeof receiverDetails === 'string' 
//         ? JSON.parse(receiverDetails) 
//         : receiverDetails;
//       console.log("📦 Parsed receiver details:", JSON.stringify(parsedReceiverDetails, null, 2));
//     } catch (error) {
//       console.log("❌ Error parsing receiverDetails:", error);
//       throw new AppError("Invalid receiverDetails format. Must be a valid JSON object.", 400);
//     }

//     // Create Parcel Request
//     const parcel = await ParcelRequest.create({
//       senderId: userId,
//       pickupLocation,
//       deliveryLocation,
//       deliveryStartTime,
//       deliveryEndTime,
//       senderType,
//       deliveryType,
//       price,
//       receiverDetails: parsedReceiverDetails,
//       title,
//       description,
//       images,  // Now storing the full relative path
//       status: DeliveryStatus.PENDING,
//     });
    
//     console.log("✅ Created parcel request:", parcel._id);
//     console.log("📸 Saved image paths:", parcel.images);

//     // Fetch the newly created parcel with populated senderId
//     const fullParcel = await ParcelRequest.findById(parcel._id).populate("senderId", "fullName email mobileNumber image");

//     res.status(201).json({
//       status: "success",
//       data: fullParcel
//     });
//   } catch (error) {
//     console.error("❌ Error in createParcelRequest:", error);
//     next(error);
//   }
// };


export const createParcelRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("🔄 createParcelRequest called");
    console.log("📄 Request body:", JSON.stringify(req.body, null, 2));
    console.log("📄 Request files:", req.files);
    
    // Handle file upload with Multer
    let images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      // For debugging
      console.log(`📸 Received ${(req.files as Express.Multer.File[]).length} files`);
      (req.files as Express.Multer.File[]).forEach((file, index) => {
        console.log(`📸 File ${index + 1}:`, file.filename, file.path);
      });
      
      // Store URLs instead of just filenames for better frontend accessibility
      images = (req.files as Express.Multer.File[]).map(file => `/uploads/parcels/${file.filename}`);
      console.log("📸 Processed image paths:", images);
    } else {
      console.log("⚠️ No files received in request");
    }

    // Ensure the required fields are properly extracted
    const {
      pickupLocation,
      deliveryLocation,
      deliveryStartTime,
      deliveryEndTime,
      senderType,
      deliveryType,
      price,
      name,  // New name field
      phoneNumber,  // New phoneNumber field
      title,
      description,
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      console.log("❌ No user ID found in request");
      throw new AppError("Unauthorized", 401);
    }
    
    console.log("👤 User ID:", userId);

    // Validate required fields
    if (!pickupLocation || !deliveryLocation || !deliveryStartTime || !deliveryEndTime || !senderType || !deliveryType || !price || !name || !phoneNumber) {
      console.log("❌ Missing required fields");
      throw new AppError("All fields are required", 400);
    }

    // Validate senderType from enum
    if (!Object.values(SenderType).includes(senderType as SenderType)) {
      console.log("❌ Invalid senderType:", senderType);
      throw new AppError(`Invalid senderType. Allowed values: ${Object.values(SenderType).join(", ")}`, 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User not found with ID:", userId);
      throw new AppError("User not found", 404);
    }
    
    console.log("👤 Found user:", user.email || user.fullName);

    if (user.freeDeliveries > 0) {
      user.freeDeliveries -= 1;
      await user.save();
      console.log("🎫 Used a free delivery. Remaining:", user.freeDeliveries);
    }

    // Create Parcel Request
    const parcel = await ParcelRequest.create({
      senderId: userId,
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
      images,  // Now storing the full relative path
      status: DeliveryStatus.PENDING,
    });
    
    console.log("✅ Created parcel request:", parcel._id);
    console.log("📸 Saved image paths:", parcel.images);

    // Fetch the newly created parcel with populated senderId
    const fullParcel = await ParcelRequest.findById(parcel._id).populate("senderId", "fullName email mobileNumber name phoneNumber image ");

    res.status(201).json({
      status: "success",
      data: fullParcel
    });
  } catch (error) {
    console.error("❌ Error in createParcelRequest:", error);
    next(error);
  }
};



/**
 * ✅ Get Available Parcels (Only `pending` status)
 */
export const getAvailableParcels = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parcels = await ParcelRequest.find({ status: DeliveryStatus.PENDING });

    res.status(200).json({
      status: "success",
      data: parcels,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * ✅ Get Parcels for Logged-in User
 */

// export const getUserParcels = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) throw new AppError("Unauthorized", 401);

//     let parcels;

//     if (req.user && req.user.role === UserRole.recciver) {
//       // Delivery man sees only assigned parcels
//       parcels = await ParcelRequest.find({
//         assignedDelivererId: userId, // Only show if assigned
//         status: { 
//           $in: [
//             DeliveryStatus.ACCEPTED, 
//             DeliveryStatus.IN_TRANSIT, 
//             DeliveryStatus.DELIVERED
//           ] 
//         }
//       })
//       .populate("senderId", "fullName email mobileNumber role")
//       .populate("assignedDelivererId", "fullName email mobileNumber role")
//       .populate("deliveryRequests", "fullName email mobileNumber role")
//       .lean();
//     } else {
//       // Sender sees all their parcels
//       parcels = await ParcelRequest.find({
//         senderId: userId,
//         status: { 
//           $in: [
//             DeliveryStatus.PENDING, 
//             DeliveryStatus.REQUESTED, 
//             DeliveryStatus.ACCEPTED, 
//             DeliveryStatus.IN_TRANSIT, 
//             DeliveryStatus.DELIVERED
//           ] 
//         }
//       })
//       .populate("senderId", "fullName email mobileNumber role")
//       .populate("assignedDelivererId", "fullName email mobileNumber role")
//       .populate("deliveryRequests", "fullName email mobileNumber role")
//       .lean();
//     }

//     res.status(200).json({
//       status: "success",
//       data: parcels,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const getUserParcels = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    let parcels;

    if (req.user && req.user.role === UserRole.recciver) {
      // Receiver sees only assigned parcels (Accepted, In Transit, Delivered)
      parcels = await ParcelRequest.find({
        assignedDelivererId: userId, // Only show if assigned
        status: {
          $in: [DeliveryStatus.ACCEPTED, DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED]
        }
      })
        .populate("senderId", "fullName email mobileNumber role")
        .populate("assignedDelivererId", "fullName email mobileNumber role")
        .populate("deliveryRequests", "fullName email mobileNumber role")
        .lean();
    } else {
      // Sender sees PENDING and REQUESTED parcels only
      parcels = await ParcelRequest.find({
        senderId: userId, // Only the sender's parcels
        status: {
          $in: [DeliveryStatus.IN_TRANSIT, DeliveryStatus.REQUESTED, DeliveryStatus.ACCEPTED]  // Show only PENDING or REQUESTED status
        }
      })
        .limit(5) // Only fetch the first 5 parcels
        .skip(0) // You can use this for pagination (e.g., skip 5 for next page)
        .populate("senderId", "fullName email mobileNumber role")
        .populate("assignedDelivererId", "fullName email mobileNumber role")
        .populate("deliveryRequests", "fullName email mobileNumber role")
        .lean();
    }

    res.status(200).json({
      status: "success",
      data: parcels,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Get Available Parcels within a Specific Radius
 */
export const getParcelsByRadius = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);
    const radius = parseFloat(req.query.radius as string);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
      throw new AppError('Latitude, longitude, and radius must be valid numbers', 400);
    }

    const parcels = await ParcelRequest.find({
      'pickupLocation.latitude': { $gte: latitude - radius, $lte: latitude + radius },
      'pickupLocation.longitude': { $gte: longitude - radius, $lte: longitude + radius }
    });

    res.json({ status: 'success', data: parcels });
  } catch (error) {
    next(error);
  }
};



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

//     // 🟢 If Delivered, Update Sender & Receiver Profile
//     if (status === DeliveryStatus.DELIVERED) {
//       const sender = await User.findById(parcel.senderId);
//       if (sender) {
//         sender.totalSentParcels = (sender.totalSentParcels || 0) + 1;
//         await sender.save();
//       }

//       const receiver = await User.findById(parcel.receiverId); // Assuming `receiverId` exists
//       if (receiver) {
//         receiver.totalReceivedParcels = (receiver.totalReceivedParcels || 0) + 1;
//         await receiver.save();
//       }
//     }

//     res.status(200).json({ status: 'success', message: `Parcel status updated to ${status}`, data: parcel });
//   } catch (error) {
//     next(error);
//   }
// };


export const updateParcelStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { parcelId, status } = req.body;

    if (!parcelId || !status) {
      throw new AppError("Parcel ID and status are required", 400);
    }

    // Validate status
    const validStatuses = [
      DeliveryStatus.REQUESTED,
      DeliveryStatus.ACCEPTED,
      DeliveryStatus.IN_TRANSIT,
      DeliveryStatus.DELIVERED
    ];

    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status. Allowed values: ${validStatuses.join(", ")}`, 400);
    }

    // Find the parcel
    const parcel = await ParcelRequest.findById(parcelId);
    if (!parcel) {
      throw new AppError("Parcel not found", 404);
    }

    // Check if user is authorized to update status
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    if (status === DeliveryStatus.REQUESTED) {
      // Only a delivery man can request a parcel
      if (parcel.status !== DeliveryStatus.PENDING) {
        throw new AppError("Only pending parcels can be requested", 400);
      }
      parcel.status = DeliveryStatus.REQUESTED;
      parcel.deliveryId = new mongoose.Types.ObjectId(userId);
    } else if (status === DeliveryStatus.ACCEPTED) {
      // Only sender can accept a request
      if (parcel.status !== DeliveryStatus.REQUESTED || parcel.senderId.toString() !== userId) {
        throw new AppError("Only the sender can accept the request", 400);
      }
      parcel.status = DeliveryStatus.ACCEPTED;
    } else if (status === DeliveryStatus.IN_TRANSIT) {
      // Only the delivery man can move the parcel to in_transit
      if (parcel.status !== DeliveryStatus.ACCEPTED || parcel.receiverId?.toString() !== userId) {
        throw new AppError("Only the assigned delivery man can update to in_transit", 400);
      }
      parcel.status = DeliveryStatus.IN_TRANSIT;
    } else if (status === DeliveryStatus.DELIVERED) {
      // Both sender and delivery man can update to delivered
      if (parcel.status !== DeliveryStatus.IN_TRANSIT) {
        throw new AppError("Only in_transit parcels can be marked as delivered", 400);
      }
      parcel.status = DeliveryStatus.DELIVERED;
    }

    await parcel.save();

    res.status(200).json({
      status: "success",
      message: `Parcel status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
};
