
// controllers/parcel.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ParcelRequest } from './ParcelRequest.model';
import { User } from '../user/user.model';
import { AppError } from '../../middlewares/error';
import { DeliveryStatus, DeliveryType, SenderType, UserRole } from '../../../types/enums';
import { AuthRequest } from '../../middlewares/auth';
import mongoose from 'mongoose';
import upload from "../../../multer/multer"; // ✅ Import multer configuration
import moment from 'moment';




// export const createParcelRequest = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { pickupLocation, deliveryLocation, deliveryStartTime, deliveryEndTime, senderType, deliveryType, price, name, phoneNumber, title, description } = req.body;
//     const userId = req.user?.id; // Extract user ID from the authenticated user

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

//     // 1. Unauthorized Access Check
//     if (!userId) {
//       throw new AppError("Unauthorized", 401);
//     }

//     // 2. Validation of Required Fields
//     if (!pickupLocation || !deliveryLocation || !deliveryStartTime || !deliveryEndTime || !senderType || !deliveryType || !price || !name || !phoneNumber || !title) {
//       throw new AppError("Missing required fields", 400);
//     }

//     // 3. Validate senderType from enum
//     if (!Object.values(SenderType).includes(senderType as SenderType)) {
//       throw new AppError(`Invalid senderType. Allowed values: ${Object.values(SenderType).join(", ")}`, 400);
//     }

//     // 4. Find the User
//     const user = await User.findById(userId);
//     if (!user) {
//       throw new AppError("User not found", 404);
//     }

//     // 5. Handle Free Deliveries (optional)
//     if (user.freeDeliveries > 0) {
//       user.freeDeliveries -= 1;
//       await user.save();
//     }

//     // 6. Create the Parcel Request
//     const parcel = await ParcelRequest.create({
//       senderId: userId,
//       pickupLocation,
//       deliveryLocation,
//       deliveryStartTime,
//       deliveryEndTime,
//       senderType,
//       deliveryType,
//       price,
//       name,
//       phoneNumber,
//       title,
//       description,
//       images,
//       status: DeliveryStatus.PENDING,
//     });

//     // 7. Return Response
//     const fullParcel = await ParcelRequest.findById(parcel._id).populate("senderId", "fullName email mobileNumber name phoneNumber image");

//     res.status(201).json({
//       status: "success",
//       data: fullParcel,
//     });
//   } catch (error) {
//     // Catch all other errors (e.g., database issues)
//     if (error instanceof AppError) {
//       // Known errors (AppError)
//       res.status(error.statusCode).json({
//         status: "error",
//         message: error.message,
//       });
//     } else {
//       // Unknown errors (server issues)
//       console.error("Internal Server Error:", error);
//       res.status(500).json({
//         status: "error",
//         message: "Internal Server Error. Please try again later.",
//       });
//     }
//     next(error);  // Pass the error to the next middleware (optional)
//   }
// };




export const createParcelRequest = async (req: Request, res: Response, next: NextFunction) => {
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
      description 
    } = req.body;

    const userId = req.user?.id; // Extract user ID from the authenticated user

    // 1. Unauthorized Access Check
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    // 2. Convert deliveryStartTime and deliveryEndTime from string to Date
    const parsedDeliveryStartTime = new Date(deliveryStartTime);
    const parsedDeliveryEndTime = new Date(deliveryEndTime);

    // 3. Check if the date conversion is valid
    if (isNaN(parsedDeliveryStartTime.getTime()) || isNaN(parsedDeliveryEndTime.getTime())) {
      throw new AppError("Invalid date format for delivery start or end time", 400);
    }

    // 4. Ensure description is a string
    const safeDescription = description || ""; // Default to an empty string if undefined or null

    // 5. Handle image files (ensure req.files is an array of files)
    let images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      images = req.files.map((file: Express.Multer.File) => `/uploads/parcels/${file.filename}`);
    } else {
      console.log("⚠️ No files received in request");
    }

    // 6. Create the Parcel Request
    const parcel = await ParcelRequest.create({
      senderId: userId,
      pickupLocation,
      deliveryLocation,
      deliveryStartTime: parsedDeliveryStartTime, // Now Date type
      deliveryEndTime: parsedDeliveryEndTime,     // Now Date type
      senderType,
      deliveryType,
      price,
      name,
      phoneNumber,
      title,
      description: safeDescription, // Now guaranteed to be a string
      images,
      status: DeliveryStatus.PENDING,
    });

    // 7. Return Response
    const fullParcel = await ParcelRequest.findById(parcel._id).populate("senderId", "fullName email mobileNumber name phoneNumber image");

    res.status(201).json({
      status: "success",
      data: fullParcel,
    });
  } catch (error) {
    // Catch all errors
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });
    } else {
      console.error("Internal Server Error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal Server Error. Please try again later.",
      });
    }
    next(error);  // Pass the error to the next middleware (optional)
  }
};

export const getAvailableParcels = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Find parcels with the status PENDING
    const parcels = await ParcelRequest.find({ status: DeliveryStatus.PENDING })
      .select('title pickupLocation deliveryLocation deliveryTime deliveryType senderType status deliveryRequests name phoneNumber createdAt updatedAt images')  // Selecting the fields you need
      .populate("senderId", "fullName email mobileNumber profileImage role")  // Populating sender information (e.g., fullName, email, mobileNumber, profileImage, role)

    res.status(200).json({
      status: "success",
      data: parcels,
    });
  } catch (error) {
    next(error);
  }
};


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

    if (status === DeliveryStatus.DELIVERED) {
      // Handle rating and review only when the parcel is delivered
      if (rating && (rating < 1 || rating > 5)) {
        throw new AppError("Rating must be between 1 and 5", 400);
      }

      if (review && review.trim().length > 500) {
        throw new AppError("Review text cannot exceed 500 characters", 400);
      }

 // Find the sender and receiver users
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

      // Set the parcel status to 'DELIVERED'
      parcel.status = DeliveryStatus.DELIVERED;

      // Increment the receiver's received parcels count
      receiver.totalReceivedParcels += 1;

      // Check if the parcel was delivered today
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



export const getUserReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get userId from the request (logged-in user's ID)
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Fetch the reviews from the user profile
    const reviews = user.reviews;

    // If no reviews, return an appropriate message
    if (reviews.length === 0) {
      return res.status(200).json({
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

export const getFilteredParcels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract DeliveryType, pickupLocation, and deliveryLocation from query params
    const { deliveryType, pickupLocation, deliveryLocation } = req.query;

    // Ensure locations are trimmed and case-insensitive
    let query: any = { status: DeliveryStatus.PENDING };

    // Apply filters to query
    if (deliveryType) {
      query.deliveryType = deliveryType;
    }

    if (pickupLocation) {
      query.pickupLocation = { $regex: new RegExp(`^${pickupLocation}$`, 'i') }; // Case-insensitive match
    }

    if (deliveryLocation) {
      query.deliveryLocation = { $regex: new RegExp(`^${deliveryLocation}$`, 'i') }; // Case-insensitive match
    }

    // Fetch filtered parcels from the database
    const parcels = await ParcelRequest.find(query)
      .select('title senderId pickupLocation deliveryLocation deliveryStartTime deliveryEndTime deliveryType status name phoneNumber images')
      .populate("senderId", "fullName email mobileNumber role")
      .lean();

    if (parcels.length === 0) {
      // Handle case when no parcels are found
      return res.status(200).json({
        status: "success",
        message: "No parcels match the filter criteria",
        data: [],
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

// export const getFilteredParcels = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     // Extract DeliveryType, pickupLocation, and deliveryLocation from query params
//     const { deliveryType, pickupLocation, deliveryLocation } = req.query;

//     // Ensure locations are trimmed and case-insensitive
//     let query: any = { status: DeliveryStatus.PENDING };

//     // Apply filters to query
//     if (deliveryType) {
//       query.deliveryType = deliveryType;
//     }

//     if (pickupLocation) {
//       query.pickupLocation = { $regex: new RegExp(`^${pickupLocation}$`, 'i') }; // Case-insensitive match
//     }

//     if (deliveryLocation) {
//       query.deliveryLocation = { $regex: new RegExp(`^${deliveryLocation}$`, 'i') }; // Case-insensitive match
//     }

//     // Fetch filtered parcels from the database
//     const parcels = await ParcelRequest.find(query)
//       .select('title senderId pickupLocation deliveryLocation deliveryStartTime deliveryEndTime deliveryType status name phoneNumber images')
//       .populate("senderId", "fullName email mobileNumber role")
//       .lean();

//     if (parcels.length === 0) {
//       // Handle case when no parcels are found
//       return res.status(200).json({
//         status: "success",
//         message: "No parcels match the filter criteria",
//         data: [],
//       });
//     }

//     res.status(200).json({
//       status: "success",
//       data: parcels,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

