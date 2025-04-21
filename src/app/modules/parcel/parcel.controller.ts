
import { Request, Response, NextFunction } from 'express';
import { ParcelRequest } from './ParcelRequest.model';
import { User } from '../user/user.model';
import { AppError } from '../../middlewares/error';
import { DeliveryStatus, DeliveryType, SenderType, UserRole } from '../../../types/enums';
import { AuthRequest } from '../../middlewares/auth';
import mongoose from 'mongoose';
import upload from "../../../multer/multer"; // ✅ Import multer configuration
import moment from 'moment';
import axios from 'axios';
import admin from '../../../config/firebase'; // ✅ Import Firebase admin SDK
import { Notification } from '../notification/notification.model';

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



// Function to get coordinates using Google Maps Geocoding API
const getCoordinates = async (location: string) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Ensure you have set this in your environment variables
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
      description,
      // images
    } = req.body;

    let images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      images = req.files.map((file: Express.Multer.File) => `/uploads/parcels/${file.filename}`);
    } else {
      console.log("⚠️ No files received in request");
    }

    const pickupCoordinates = await getCoordinates(pickupLocation);
    const deliveryCoordinates = await getCoordinates(deliveryLocation);

    const parcel = await ParcelRequest.create({
      senderId: req.user?.id,
      pickupLocation: {
        type: 'Point',
        coordinates: [pickupCoordinates.longitude, pickupCoordinates.latitude] 
      },
      deliveryLocation: {
        type: 'Point',
        coordinates: [deliveryCoordinates.longitude, deliveryCoordinates.latitude] 
      },
      deliveryStartTime,
      deliveryEndTime,
      senderType,
      deliveryType,
      price,
      title,
      description,
      images: images || [],
      name,
      phoneNumber,
      status: 'PENDING',
    });

    const users = await User.find({ isVerified: true, fcmToken: { $exists: true } });


    const messages = users
      .map(user => user.fcmToken)
      .filter(token => token)
      .map(token => ({
        notification: {
          title: 'New Parcel Request',
          body: `A new parcel request has been created with the title "${title}".`,
        },
        token, 
      }));

    try {
      if (messages.length > 0) {
        const responses = await Promise.all(
          messages.map(message => admin.messaging().send(message))
        );
        console.log('Push notifications sent successfully:', responses);
      }
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }

    const notification = new Notification({
      message: `A new parcel request titled "${title}" has been created.`,
      type: 'parcel_update',  
      title: 'New Parcel Request',
      description: description || '',  
      userId: req.user?.id, 
    });

    await notification.save();


    const fullParcel = await ParcelRequest.findById(parcel._id).populate('senderId', 'fullName email mobileNumber name phoneNumber image');

    res.status(201).json({
      status: 'success',
      data: fullParcel,
    });
  } catch (error) {
    console.error('Error creating parcel:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create parcel request',
    });
    next(error);
  }
};

// export const createParcelRequest = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const {
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
//     } = req.body;

//     let images: string[] = [];
//     if (req.files && Array.isArray(req.files)) {
//       images = req.files.map((file: Express.Multer.File) => `/uploads/parcels/${file.filename}`);
//     } else {
//       console.log("⚠️ No files received in request");
//     }

//     const pickupCoordinates = await getCoordinates(pickupLocation);
//     const deliveryCoordinates = await getCoordinates(deliveryLocation);

//     // Create the new parcel request
//     const parcel = await ParcelRequest.create({
//       senderId: req.user?.id,
//       pickupLocation: {
//         type: 'Point',
//         coordinates: [pickupCoordinates.longitude, pickupCoordinates.latitude]
//       },
//       deliveryLocation: {
//         type: 'Point',
//         coordinates: [deliveryCoordinates.longitude, deliveryCoordinates.latitude]
//       },
//       deliveryStartTime,
//       deliveryEndTime,
//       senderType,
//       deliveryType,
//       price,
//       title,
//       description,
//       images: images || [],
//       name,
//       phoneNumber,
//       status: 'PENDING',
//     });

//     if (req.user?.id) {
//       const updatedUser = await User.findByIdAndUpdate(
//         req.user.id,
//         { $inc: { totalSentParcels: 1 } }, 
//         { new: true } 
//       );
//       console.log('Updated User:', updatedUser); 
//     }

//     // Send notifications as before
//     const users = await User.find({ isVerified: true, fcmToken: { $exists: true } });
//     const messages = users
//       .map(user => user.fcmToken)
//       .filter(token => token)
//       .map(token => ({
//         notification: {
//           title: 'New Parcel Request',
//           body: `A new parcel request has been created with the title "${title}".`,
//         },
//         token,
//       }));

//     try {
//       if (messages.length > 0) {
//         const responses = await Promise.all(
//           messages.map(message => admin.messaging().send(message))
//         );
//         console.log('Push notifications sent successfully:', responses);
//       }
//     } catch (error) {
//       console.error('Error sending push notifications:', error);
//     }

//     const notification = new Notification({
//       message: `A new parcel request titled "${title}" has been created.`,
//       type: 'parcel_update',
//       title: 'New Parcel Request',
//       description: description || '',
//       userId: req.user?.id,
//     });

//     await notification.save();

//     const fullParcel = await ParcelRequest.findById(parcel._id).populate('senderId', 'fullName email mobileNumber name phoneNumber image');

//     res.status(201).json({
//       status: 'success',
//       data: fullParcel,
//     });
//   } catch (error) {
//     console.error('Error creating parcel:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Failed to create parcel request',
//     });
//     next(error);
//   }
// };

export const getAvailableParcels = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parcels = await ParcelRequest.find({ status: DeliveryStatus.PENDING })
      .select('title description pickupLocation deliveryLocation deliveryTime deliveryType senderType status deliveryRequests name price phoneNumber createdAt updatedAt images') 
      .populate("senderId", "fullName email mobileNumber profileImage role");

    const reorderedParcels = parcels.map(parcel => {
      const { _id, ...rest } = parcel.toObject(); 
      return { _id, ...rest }; 
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

    // Check if the user is a receiver or sender to fetch parcels accordingly
    if (req.user && req.user.role === UserRole.recciver) {
      parcels = await ParcelRequest.find({
        assignedDelivererId: userId, 
      })
        .populate("senderId", "fullName email mobileNumber role")
        .populate("assignedDelivererId", "fullName email mobileNumber role")
        .populate("deliveryRequests", "fullName email mobileNumber role")
        .lean();
    } else {
      parcels = await ParcelRequest.find({
        senderId: userId, 
      })
        .populate("senderId", "fullName email mobileNumber role")
        .populate("assignedDelivererId", "fullName email mobileNumber role")
        .populate("deliveryRequests", "fullName email mobileNumber role")
        .lean();
    }

    // Limit the number of deliveryRequests to the latest 5
    if (parcels && parcels.length > 0) {
      parcels = parcels.map(parcel => {
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

export const getParcelsByRadius = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude, radius, status } = req.body;

    // Validate inputs
    if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
      throw new AppError('Latitude, longitude, and radius must be valid numbers', 400);
    }

    console.log(`Searching for parcels within ${radius} km of lat: ${latitude}, lon: ${longitude}`);

    // Convert radius from km to radians (1 km = 1/6371 of a circle)
    const radiusInRadians = radius / 6371;

    // Prepare geospatial query filter
    const filter: any = {
      'pickupLocation.coordinates': {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radiusInRadians],  // radius in radians
        },
      },
    };

    // Optional: Add status filter if provided
    if (status && Object.values(DeliveryStatus).includes(status)) {
      filter.status = status;  // Only include parcels with the specified status
    }

    // Query the database using the geospatial filter
    const parcels = await ParcelRequest.find(filter);

    // Check if parcels were found
    if (parcels.length === 0) {
      console.log('No parcels found within the specified radius.');
    } else {
      console.log(`Found ${parcels.length} parcels within the specified radius.`);
    }

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




// export const getFilteredParcels = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { latitude, longitude, radius = 10 } = req.query;

//     // Parse latitude and longitude
//     const lat = parseFloat(latitude as string);
//     const lng = parseFloat(longitude as string);

//     if (isNaN(lat) || isNaN(lng)) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Invalid latitude or longitude values.',
//       });
//     }

//     console.log(`Searching for parcels within ${radius} km of lat: ${lat}, lon: ${lng}`);

//     // Build geospatial query for parcels near the pickupLocation
//     const nearbyPickupQuery: any = {
//       status: DeliveryStatus.PENDING,
//       pickupLocation: {
//         $nearSphere: {
//           $geometry: { type: 'Point', coordinates: [lng, lat] }, // GeoJSON format
//           $maxDistance: parseFloat(radius as string) * 1000, // Convert radius to meters
//         },
//       },
//     };
    
//     // Log the query for debugging
//     console.log('Nearby Pickup Query:', nearbyPickupQuery);

//     // Fetch nearby parcels
//     const nearbyParcels = await ParcelRequest.find(nearbyPickupQuery)
//       .select('title senderId pickupLocation deliveryLocation deliveryStartTime deliveryEndTime deliveryType status name phoneNumber images')
//       .populate('senderId', 'fullName email mobileNumber role')
//       .lean();

//     // If no parcels found, return an error message
//     if (nearbyParcels.length === 0) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'No parcels found within the specified radius.',
//       });
//     }

//     res.status(200).json({
//       status: 'success',
//       data: nearbyParcels,
//     });
//   } catch (error) {
//     console.error('Error fetching parcels:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Internal server error',
//     });
//   }
// };

export const getFilteredParcels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude, radius = 15 } = req.query;

    // Parse latitude and longitude from query parameters
    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);

    // Check if latitude is invalid
    if (isNaN(lat)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid latitude value. Please provide a valid number for latitude.',
      });
    }

    // Check if longitude is invalid
    if (isNaN(lng)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid longitude value. Please provide a valid number for longitude.',
      });
    }

    console.log(`Searching for parcels within ${radius} km of lat: ${lat}, lon: ${lng}`);

    const maxDistance = parseFloat(radius as string) * 1000;

    // Build geospatial query for parcels near pickupLocation
    const nearbyPickupQuery: any = {
      status: DeliveryStatus.PENDING,
      pickupLocation: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lng, lat] }, // GeoJSON format
          $maxDistance: maxDistance, // Max distance in meters
        },
      },
    };

    // Build geospatial query for parcels near deliveryLocation
    const nearbyDeliveryQuery: any = {
      status: DeliveryStatus.PENDING,
      deliveryLocation: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lng, lat] }, // GeoJSON format
          $maxDistance: maxDistance, // Max distance in meters
        },
      },
    };

    // Fetch nearby parcels based on pickupLocation query
    const nearbyPickupParcels = await ParcelRequest.find(nearbyPickupQuery)
      .select('title price senderId description pickupLocation deliveryLocation deliveryStartTime deliveryEndTime deliveryType status name phoneNumber images')
      .populate('senderId', 'fullName email mobileNumber role')
      .lean();

    const nearbyDeliveryParcels = await ParcelRequest.find(nearbyDeliveryQuery)
      .select('title price senderId description pickupLocation deliveryLocation deliveryStartTime deliveryEndTime deliveryType status name phoneNumber images')
      .populate('senderId', 'fullName email mobileNumber role')
      .lean();

    const allNearbyParcels = [...nearbyPickupParcels, ...nearbyDeliveryParcels];

    // If no parcels found, return an error message
    if (allNearbyParcels.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No parcels found within the specified radius.',
      });
    }

    // Return the nearby parcels found
    res.status(200).json({
      status: 'success',
      data: allNearbyParcels,
    });
  } catch (error) {
    console.error('Error fetching parcels:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

// export const getFilteredParcels = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { latitude, longitude, radius = 10 } = req.query;

//     // Parse latitude and longitude from query parameters
//     const lat = parseFloat(latitude as string);
//     const lng = parseFloat(longitude as string);

//     if (isNaN(lat) || isNaN(lng)) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Invalid latitude or longitude values.',
//       });
//     }

//     // Log the incoming request for debugging
//     console.log(`Searching for parcels within ${radius} km of lat: ${lat}, lon: ${lng}`);

//     // Convert radius from km to meters
//     const maxDistance = parseFloat(radius as string) * 1000;

//     // Build geospatial query for parcels near pickupLocation
//     const nearbyPickupQuery: any = {
//       status: DeliveryStatus.PENDING,
//       pickupLocation: {
//         $nearSphere: {
//           $geometry: { type: 'Point', coordinates: [lng, lat] }, // GeoJSON format
//           $maxDistance: maxDistance, // Max distance in meters
//         },
//       },
//     };

//     // Build geospatial query for parcels near deliveryLocation
//     const nearbyDeliveryQuery: any = {
//       status: DeliveryStatus.PENDING,
//       deliveryLocation: {
//         $nearSphere: {
//           $geometry: { type: 'Point', coordinates: [lng, lat] }, // GeoJSON format
//           $maxDistance: maxDistance, // Max distance in meters
//         },
//       },
//     };

//     // Fetch nearby parcels based on pickupLocation query
//     const nearbyPickupParcels = await ParcelRequest.find(nearbyPickupQuery)
//       .select('title price senderId pickupLocation deliveryLocation deliveryStartTime deliveryEndTime deliveryType status name phoneNumber images')
//       .populate('senderId', 'fullName email mobileNumber role')
//       .lean();

//     // Fetch nearby parcels based on deliveryLocation query
//     const nearbyDeliveryParcels = await ParcelRequest.find(nearbyDeliveryQuery)
//       .select('title price senderId pickupLocation deliveryLocation deliveryStartTime deliveryEndTime deliveryType status name phoneNumber images')
//       .populate('senderId', 'fullName email mobileNumber role')
//       .lean();

//     // Combine results from both queries (pickupLocation and deliveryLocation)
//     const allNearbyParcels = [...nearbyPickupParcels, ...nearbyDeliveryParcels];

//     // If no parcels found, return an error message
//     if (allNearbyParcels.length === 0) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'No parcels found within the specified radius.',
//       });
//     }

//     // Return the nearby parcels found
//     res.status(200).json({
//       status: 'success',
//       data: allNearbyParcels,
//     });
//   } catch (error) {
//     console.error('Error fetching parcels:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Internal server error',
//     });
//   }
// };




