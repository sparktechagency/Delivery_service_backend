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
import { Body } from 'twilio/lib/twiml/MessagingResponse';
import DeviceToken from '../user/fcm.token.model';
import moment from 'moment';


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
// export const requestToDeliver = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const { parcelIds } = req.body;  
//     const userId = req.user?.id;    

//     if (!userId) {
//       throw new AppError("Unauthorized", 401);
//     }

//     const parcelObjectIds = parcelIds.map((id: string) => new mongoose.Types.ObjectId(id));
//     const userObjectId = new mongoose.Types.ObjectId(userId);

//     const parcels = await ParcelRequest.find({
//       _id: { $in: parcelObjectIds },
//       status: DeliveryStatus.PENDING,
//     });
   
//     //check if parcel are same user to request then show your the owner this parcel not able to request
//     for (let parcel of parcels) {
//       if (parcel.senderId.toString() === userObjectId.toString()) {
//         throw new AppError(`You can't request to deliver your own parcel ${parcel._id}`, 400);
//       }
//     }

//     if (parcels.length === 0) {
//       throw new AppError("No available parcels found", 404);
//     }

//     const user = await User.findById(userObjectId);
//     if (!user) {
//       throw new AppError("User not found", 404);
//     }

//     for (let parcel of parcels) {
//       if (parcel.deliveryRequests.includes(userObjectId)) {
//         throw new AppError(`You have already requested to deliver parcel ${parcel._id}`, 400);
//       }

//       parcel.deliveryRequests.push(userObjectId);
//       parcel.status = DeliveryStatus.REQUESTED;
//       await parcel.save();

//       // 🚀 Start Notification Logic here
//       const senderUser = await User.findById(parcel.senderId);

//       if (senderUser?.fcmToken) {
//         const senderMessage = {
//           notification: {
//             title: 'Delivery Request',
//             body: `${user.role === 'recciver' ? 'A deliverer has requested' : 'A user has requested'} to deliver your parcel titled "${parcel.title}".`,
//             mobileNumber: user.mobileNumber || 'Unknown Number',
//             image:user.image || 'https://i.ibb.co/z5YHLV9/profile.png',
//             AvgRating: user.avgRating || 0,
//           },
//           token: senderUser.fcmToken,
//         };

//         try {
//           await admin.messaging().send(senderMessage);
//           console.log('Push notification sent to sender.');
//         } catch (err) {
//           console.error('Error sending push notification to sender:', err);
//         }
//       }

//       const notification = new Notification({
//         message: `${user.role === 'recciver' ? 'A deliverer has requested' : 'A user has requested'} to deliver your parcel titled "${parcel.title}".`,
//         type: 'Recciver',
//         title: `"${user.fullName} Send The Delivery Request"`,
//         description: parcel.description || '',
//         parcelTitle: parcel.title || '',
//         price: parcel.price || '',
//         requestId: parcel._id,
//         userId: senderUser?._id,
//         image: user.image || 'https://i.ibb.co/z5YHLV9/profile.png',
//         AvgRating: user.avgRating || 0,
//         SenderName: user.fullName || '',
//         mobileNumber: user.mobileNumber || ' ',
        
//       });

//       await notification.save();
//       // 🚀 End Notification Logic
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

    // Query for parcels that are PENDING and not already requested by the user
    const parcels = await ParcelRequest.find({
      _id: { $in: parcelObjectIds },
      status: DeliveryStatus.PENDING,
      deliveryRequests: { $ne: userObjectId }  // Ensure user hasn't already requested it
    });
   
    if (parcels.length === 0) {
      throw new AppError("No available parcels found or you have already requested these parcels", 404);
    }

    // Check if user is the sender (cannot request own parcels)
    for (let parcel of parcels) {
      if (parcel.senderId.toString() === userObjectId.toString()) {
        throw new AppError(`You can't request to deliver your own parcel ${parcel._id}`, 400);
      }
    }

    // Proceed with adding the user to the deliveryRequests array
    const user = await User.findById(userObjectId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    for (let parcel of parcels) {
      // Add user to deliveryRequests
      parcel.deliveryRequests.push(userObjectId);
      parcel.status = DeliveryStatus.REQUESTED;
      await parcel.save();

       await User.findByIdAndUpdate(parcel.senderId, {
      $push: {
        RecciveOrders: {
          parcelId: parcel._id,
          pickupLocation: parcel.pickupLocation?.coordinates
            ? `${parcel.pickupLocation.coordinates[1]},${parcel.pickupLocation.coordinates[0]}`
            : "",
          deliveryLocation: parcel.deliveryLocation?.coordinates
            ? `${parcel.deliveryLocation.coordinates[1]},${parcel.deliveryLocation.coordinates[0]}`
            : "",
          price: parcel.price,
          title: parcel.title,
          description: parcel.description,
          senderType: parcel.senderType,
          deliveryType: parcel.deliveryType,
          deliveryStartTime: parcel.deliveryStartTime,
          deliveryEndTime: parcel.deliveryEndTime,
          Images: parcel.images,
        },
      },
      $inc: { totalReceivedParcels: 1 },
    });
    
     const sender = await User.findById(parcel.senderId);

    // Fix role enum spelling if necessary
    if (sender && sender.role === UserRole.SENDER) {
      sender.role = UserRole.RECCIVER; 
      await sender.save();
    }

    // Fetch sender for notification meta info
    const deliverer = await User.findById(parcel.assignedDelivererId);

//     // ✅ Get FCM token from DeviceToken collection (like in createParcelRequest)
    // const deviceToken = await DeviceToken.findOne({
    //   userId: parcel.senderId,
    //   fcmToken: { $exists: true, $ne: '' }
    // });

//     // ✅ Send push notification if token exists
//     if (deviceToken?.fcmToken) {
//       const notificationMessage = `Requested to deliver "${parcel.title}".`;
      
//       const pushPayload = {
//         notification: {
//           title: parcel.title,
//           body: notificationMessage,
//         },
//         data: {
//           type: 'delivery_request',
//           title: parcel.title,
//           message: notificationMessage,
//           parcelId: parcel._id.toString(),
//           price: String(parcel.price || ''),
//           description: parcel.description || '',
//           phoneNumber: parcel.phoneNumber || '',
//           deliveryStartTime: parcel.deliveryStartTime?.toISOString() || '',
//           deliveryEndTime: parcel.deliveryEndTime?.toISOString() || '',
//           pickupLatitude: parcel.pickupLocation?.coordinates?.[1]?.toString() || '',
//           pickupLongitude: parcel.pickupLocation?.coordinates?.[0]?.toString() || '',
//           deliveryLatitude: parcel.deliveryLocation?.coordinates?.[1]?.toString() || '',
//           deliveryLongitude: parcel.deliveryLocation?.coordinates?.[0]?.toString() || '',
//           image: user.image || 'https://i.ibb.co/z5YHLV9/profile.png',
//         },
//         token: deviceToken.fcmToken,
//       };

//       try {
//         await admin.messaging().send(pushPayload);
//         console.log(`✅ Push notification sent to assigned deliverer: ${deviceToken.fcmToken}`);
//       } catch (err) {
//         console.error(`❌ Push notification failed to deliverer ${deviceToken.fcmToken}:`, err);
//       }
//     } else {
//       console.log(`⚠️ No FCM token found for deliverer: ${parcel.senderId}`);
//     }

//     // ✅ Get FCM token from DeviceToken collection for the sender
// const deviceToken = await DeviceToken.findOne({
//   userId: parcel.senderId,  // Use the sender's userId here
//   fcmToken: { $exists: true, $ne: '' }
// });

const deviceToken = await DeviceToken.findOne({
  userId: parcel.senderId,  // Use the sender's userId here
  fcmToken: { $exists: true, $ne: '' }
});

// ✅ Send push notification if token exists
if (deviceToken?.fcmToken) {
  const notificationMessage = `Requested to deliver "${parcel.title}".`;

  const pushPayload = {
    notification: {
      title: parcel.title,
      body: notificationMessage,
    },
    data: {
      type: 'delivery_request',
      title: parcel.title,
      message: notificationMessage,
      parcelId: parcel._id.toString(),
      price: String(parcel.price || ''),
      description: parcel.description || '',
      phoneNumber: parcel.phoneNumber || '',
      deliveryStartTime: parcel.deliveryStartTime?.toISOString() || '',
      deliveryEndTime: parcel.deliveryEndTime?.toISOString() || '',
      pickupLatitude: parcel.pickupLocation?.coordinates?.[1]?.toString() || '',
      pickupLongitude: parcel.pickupLocation?.coordinates?.[0]?.toString() || '',
      deliveryLatitude: parcel.deliveryLocation?.coordinates?.[1]?.toString() || '',
      deliveryLongitude: parcel.deliveryLocation?.coordinates?.[0]?.toString() || '',
      image: user.image || 'https://i.ibb.co/z5YHLV9/profile.png',
    },
    token: deviceToken.fcmToken,
  };

  try {
    await admin.messaging().send(pushPayload);
    console.log(`✅ Push notification sent to sender: ${deviceToken.fcmToken}`);
  } catch (err) {
    console.error(`❌ Push notification failed to sender ${deviceToken.fcmToken}:`, err);
  }
} else {
  console.log(`⚠️ No FCM token found for sender: ${parcel.senderId}`);
}


      // const notification = new Notification({
      //   message: `${user.role === UserRole.RECCIVER ? 'A deliverer has requested' : 'A user has requested'} this user"${user.fullName}".`,
      //   type: 'Requested-Delivery',
      //   title: `${parcel.title}`,
      //   description: parcel.description || '',
      //   price: parcel.price || '',
      //   requestId: parcel._id,
      //   userId: user?._id,
      //   image: user.image || 'https://i.ibb.co/z5YHLV9/profile.png',
      //   AvgRating: user.avgRating || 0,
      //   SenderName: user.fullName || '',
      //   mobileNumber: user.mobileNumber || ' ',
      //   name: user.fullName || '',
      //   deliveryStartTime: parcel.deliveryStartTime,
      //   deliveryEndTime: parcel.deliveryEndTime,
      //   pickupLocation: {
      //     latitude: parcel.pickupLocation?.coordinates[1],
      //     longitude: parcel.pickupLocation?.coordinates[0]
      //   },
      //   deliveryLocation: {
      //     latitude: parcel.deliveryLocation?.coordinates[1],
      //     longitude: parcel.deliveryLocation?.coordinates[0]
      //   },
      //   Images: parcel.images,
      //   user: user.image || 'https://i.ibb.co/z5YHLV9/profile.png',
      // });
// Inside your loop where you are creating the notification:
const notification = new Notification({
  message: `${user.role === UserRole.RECCIVER ? 'A deliverer has requested' : 'A user has requested'} this user"${user.fullName}".`,
  type: 'Requested-Delivery',
  title: `${parcel.title}`,
  description: parcel.description || '',
  price: parcel.price || '',
  requestId: parcel._id,
  userId: parcel.senderId, // Assign the correct userId (parcel owner)
  image: user.image || 'https://i.ibb.co/z5YHLV9/profile.png',
  AvgRating: user.avgRating || 0,
  SenderName: user.fullName || '',
  mobileNumber: user.mobileNumber || ' ',
  name: user.fullName || '',
  deliveryStartTime: parcel.deliveryStartTime,
  deliveryEndTime: parcel.deliveryEndTime,
  pickupLocation: {
    latitude: parcel.pickupLocation?.coordinates[1],
    longitude: parcel.pickupLocation?.coordinates[0]
  },
  deliveryLocation: {
    latitude: parcel.deliveryLocation?.coordinates[1],
    longitude: parcel.deliveryLocation?.coordinates[0]
  },
  Images: parcel.images,
  user: user.image || 'https://i.ibb.co/z5YHLV9/profile.png',
});

await notification.save();

    }

    res.status(200).json({
      status: "success",
      message: "Your request to deliver the parcel(s) has been submitted successfully.",
    });

  } catch (error) {
    next(error);
  }
};

// export const removeDeliveryRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const { parcelId, delivererId } = req.body;
//     const userId = req.user?.id;

//     if (!userId) throw new AppError("Unauthorized", 401);

//     const parcel = await ParcelRequest.findById(parcelId);
//     if (!parcel) throw new AppError("Parcel not found", 404);

//     if (parcel.senderId.toString() !== userId) {
//       throw new AppError("Only the sender can remove delivery requests", 403);
//     }
//     const delivererObjectId = new mongoose.Types.ObjectId(delivererId);
//     if (!parcel.deliveryRequests.includes(delivererObjectId)) {
//       throw new AppError("This delivery man has not requested the parcel", 400);
//     }


//     parcel.deliveryRequests = parcel.deliveryRequests.filter(
//       (requesterId) => requesterId.toString() !== delivererObjectId.toString()
//     );

//     if (parcel.deliveryRequests.length === 0 && parcel.status === DeliveryStatus.REQUESTED) {
//       parcel.status = DeliveryStatus.PENDING;
//     }

// await parcel.save();

// // Find the user whose delivery request is being removed
// const RequestUser = await User.findById(delivererId);

// await User.findByIdAndUpdate(parcel.deliveryRequests.map((requesterId) => requesterId.toString()), delivererObjectId, {
//   $push: {
//     RecciveOrders: {
//       parcelId: parcel._id,
//       pickupLocation: parcel.pickupLocation?.coordinates
//         ? `${parcel.pickupLocation.coordinates[1]},${parcel.pickupLocation.coordinates[0]}`
//         : "",
//       deliveryLocation: parcel.deliveryLocation?.coordinates
//         ? `${parcel.deliveryLocation.coordinates[1]},${parcel.deliveryLocation.coordinates[0]}`
//         : "",
//       price: parcel.price,
//       title: parcel.title,
//       description: parcel.description,
//       senderType: parcel.senderType,
//       deliveryType: parcel.deliveryType,
//       deliveryStartTime: parcel.deliveryStartTime,
//       deliveryEndTime: parcel.deliveryEndTime,
//     },
//   },
//   $inc: { totalReceivedParcels: 1 },
// });

// const deliverer = await User.findById(delivererId);
//  if (deliverer && deliverer.role === UserRole.SENDER) {
//       deliverer.role = UserRole.RECCIVER; 
//       await deliverer.save();
//     }

//     // Fetch requester for notification meta info
//     const requester = await User.findById(parcel.receiverId);

//     // ✅ Get FCM token from DeviceToken collection (like in createParcelRequest)
//     const deviceToken = await DeviceToken.findOne({
//       userId: parcel.senderId,
//       fcmToken: { $exists: true, $ne: '' }
//     });

//     // ✅ Send push notification if token exists
//     if (deviceToken?.fcmToken) {
//       const notificationMessage = `You have been Rejected to deliver Requested Parcel "${parcel.title}".`;
      
//       const pushPayload = {
//         notification: {
//           title: parcel.title,
//           body: notificationMessage,
//         },
//         data: {
//           type: 'Rejected-Delivery',
//           title: parcel.title,
//           message: notificationMessage,
//           parcelId: parcel._id.toString(),
//           price: String(parcel.price || ''),
//           description: parcel.description || '',
//           phoneNumber: parcel.phoneNumber || '',
//           deliveryStartTime: parcel.deliveryStartTime?.toISOString() || '',
//           deliveryEndTime: parcel.deliveryEndTime?.toISOString() || '',
//           pickupLatitude: parcel.pickupLocation?.coordinates?.[1]?.toString() || '',
//           pickupLongitude: parcel.pickupLocation?.coordinates?.[0]?.toString() || '',
//           deliveryLatitude: parcel.deliveryLocation?.coordinates?.[1]?.toString() || '',
//           deliveryLongitude: parcel.deliveryLocation?.coordinates?.[0]?.toString() || '',
//         },
//         token: deviceToken.fcmToken,
//       };

//       try {
//         await admin.messaging().send(pushPayload);
//         console.log(`✅ Push notification sent to the Reqested User: ${deviceToken.fcmToken}`);
//       } catch (err) {
//         console.error(`❌ Push notification failed to the Reqested User ${deviceToken.fcmToken}:`, err);
//       }
//     } else {
//       console.log(`⚠️ No FCM token found for the Reqested User: ${delivererId}`);
//     }
// const notification = new Notification({
//   message: `${RequestUser?.role === 'sender' ? 'A deliverer has requested has been removed' : 'A sender has removed'} you removed to this delivery parcel titled "${parcel.title}".`,
//   type: 'Rejected',
//   title: `"${parcel.title} "`,
//   description: parcel.description || '',
//   parcelTitle: parcel.title || '',
//   price: parcel.price || '',
//   requestId: parcel._id,
//   userId: RequestUser?._id,
//   image: RequestUser?.image || 'https://i.ibb.co/z5YHLV9/profile.png',
//   AvgRating: RequestUser?.avgRating || 0,
//   SenderName: RequestUser?.fullName || '',
//   mobileNumber: RequestUser?.mobileNumber || ' ',
//   deliveryStartTime: parcel.deliveryStartTime,
//   deliveryEndTime: parcel.deliveryEndTime,
//   pickupLocation: {
//     latitude: parcel.pickupLocation?.coordinates[1],
//     longitude: parcel.pickupLocation?.coordinates[0]
//   },
//   deliveryLocation: {
//     latitude: parcel.deliveryLocation?.coordinates[1],
//     longitude: parcel.deliveryLocation?.coordinates[0]
//   }
  
// });

// await notification.save();

//     res.status(200).json({
//       status: "success",
//       message: "Delivery request removed successfully",
//     });
//   } catch (error) {
//     next(error);
//   }
// };
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

    // Remove the delivery request
    parcel.deliveryRequests = parcel.deliveryRequests.filter(
      (requesterId) => requesterId.toString() !== delivererObjectId.toString()
    );

    if (parcel.deliveryRequests.length === 0 && parcel.status === DeliveryStatus.REQUESTED) {
      parcel.status = DeliveryStatus.PENDING;
    }

    await parcel.save();

    // Find the user whose delivery request is being removed
    const requestedUser = await User.findById(delivererId);
    if (!requestedUser) {
      throw new AppError("Requested user not found", 404);
    }

    // ✅ Get FCM token for the DELIVERER (not sender) - they should be notified of rejection
    const deviceToken = await DeviceToken.findOne({
      userId: requestToDeliver,
      fcmToken: { $exists: true, $ne: 'Cancelled' }
    });

    console.log(`🔍 Looking for FCM token for deliverer: ${delivererId}`);
    console.log(`📱 Found device token:`, deviceToken ? 'Yes' : 'No');

    // ✅ Send push notification to deliverer if token exists
    if (deviceToken?.fcmToken) {
      const notificationMessage = `Your delivery request for "${parcel.title}" has been rejected.`;
      
      const pushPayload = {
        notification: {
          title: `Request Rejected`,
          body: notificationMessage,
        },
        data: {
          type: 'Cancelled',
          title: parcel.title,
          message: notificationMessage,
          parcelId: parcel._id.toString(),
          price: String(parcel.price || ''),
          description: parcel.description || '',
          phoneNumber: parcel.phoneNumber || '',
          deliveryStartTime: parcel.deliveryStartTime?.toISOString() || '',
          deliveryEndTime: parcel.deliveryEndTime?.toISOString() || '',
          pickupLatitude: parcel.pickupLocation?.coordinates?.[1]?.toString() || '',
          pickupLongitude: parcel.pickupLocation?.coordinates?.[0]?.toString() || '',
          deliveryLatitude: parcel.deliveryLocation?.coordinates?.[1]?.toString() || '',
          deliveryLongitude: parcel.deliveryLocation?.coordinates?.[0]?.toString() || '',
        },
        token: deviceToken.fcmToken,
      };

      try {
        await admin.messaging().send(pushPayload);
        console.log(`✅ Push notification sent to rejected deliverer: ${deviceToken.fcmToken}`);
      } catch (err) {
        console.error(`❌ Push notification failed to deliverer ${deviceToken.fcmToken}:`, err);
        
        // ✅ Handle invalid FCM tokens
        if (typeof err === 'object' && err !== null && 'code' in err && (err as any).code === 'messaging/registration-token-not-registered') {
          console.log(`🗑️ Removing invalid FCM token for user ${delivererId}`);
          // Remove the invalid token from database
          await DeviceToken.deleteOne({ 
            userId: delivererId, 
            fcmToken: deviceToken.fcmToken 
          });
        }
      }
    } else {
      console.log(`⚠️ No FCM token found for deliverer: ${delivererId}`);
    }

    // ✅ Create notification for the rejected deliverer
    const notification = new Notification({
      message: `Your delivery request for parcel "${parcel.title}" has been rejected by the sender.`,
      type: 'Cancelled',
      title: `Request Rejected`,
      description: parcel.description || '',
      parcelTitle: parcel.title || '',
      price: parcel.price || '',
      requestId: parcel._id,
      userId: requestedUser._id, // ✅ Notify the deliverer
      image: requestedUser.image || 'https://i.ibb.co/z5YHLV9/profile.png',
      AvgRating: requestedUser.avgRating || 0,
      SenderName: requestedUser.fullName || '',
      mobileNumber: requestedUser.mobileNumber || '',
      deliveryStartTime: parcel.deliveryStartTime,
      deliveryEndTime: parcel.deliveryEndTime,
      pickupLocation: {
        latitude: parcel.pickupLocation?.coordinates[1],
        longitude: parcel.pickupLocation?.coordinates[0]
      },
      deliveryLocation: {
        latitude: parcel.deliveryLocation?.coordinates[1],
        longitude: parcel.deliveryLocation?.coordinates[0]
      },
      isRead: false,
      createdAt: new Date(),
      localCreatedAt: moment().tz('Asia/Dhaka').format('YYYY-MM-DD hh:mm A')
    });

    await notification.save();

    res.status(200).json({
      status: "success",
      message: "Delivery request removed successfully",
    });
  } catch (error) {
    console.error('Error in removeDeliveryRequest:', error);
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

    if (parcel.senderId.toString() !== userId) {
      throw new AppError("Only the sender can assign a delivery man", 403);
    }

    const delivererObjectId = new mongoose.Types.ObjectId(delivererId);

    // Check if deliverer has requested the parcel
    const hasRequested = parcel.deliveryRequests?.some(requestId =>
      requestId.toString() === delivererObjectId.toString()
    );

    if (!hasRequested) {
      throw new AppError("The selected delivery man has not requested this parcel", 400);
    }

    // Assign deliverer and update status
    parcel.assignedDelivererId = delivererObjectId;
    parcel.status = DeliveryStatus.IN_TRANSIT;
    parcel.deliveryRequests = [];
    await parcel.save();

    // Update deliverer's received orders
    await User.findByIdAndUpdate(delivererId, {
      $push: {
        RecciveOrders: {
          parcelId: parcel._id,
          pickupLocation: parcel.pickupLocation?.coordinates
            ? `${parcel.pickupLocation.coordinates[1]},${parcel.pickupLocation.coordinates[0]}`
            : "",
          deliveryLocation: parcel.deliveryLocation?.coordinates
            ? `${parcel.deliveryLocation.coordinates[1]},${parcel.deliveryLocation.coordinates[0]}`
            : "",
          price: parcel.price,
          title: parcel.title,
          description: parcel.description,
          senderType: parcel.senderType,
          deliveryType: parcel.deliveryType,
          deliveryStartTime: parcel.deliveryStartTime,
          deliveryEndTime: parcel.deliveryEndTime,
        },
      },
      $inc: { totalReceivedParcels: 1 },
    });

    const deliverer = await User.findById(delivererId);

    // Fix role enum spelling if necessary
    if (deliverer && deliverer.role === UserRole.SENDER) {
      deliverer.role = UserRole.RECCIVER; 
      await deliverer.save();
    }

    // Fetch sender for notification meta info
    const sender = await User.findById(parcel.senderId);

    // ✅ Get FCM token from DeviceToken collection (like in createParcelRequest)
    const deviceToken = await DeviceToken.findOne({
      userId: delivererId,
      fcmToken: { $exists: true, $ne: '' }
    });

    // ✅ Send push notification if token exists
    if (deviceToken?.fcmToken) {
      const notificationMessage = `You have been assigned to deliver the parcel "${parcel.title}".`;
      
      const pushPayload = {
        notification: {
          title: parcel.title,
          body: notificationMessage,
        },
        data: {
          type: 'Accepted',
          title: parcel.title,
          message: notificationMessage,
          parcelId: parcel._id.toString(),
          price: String(parcel.price || ''),
          description: parcel.description || '',
          phoneNumber: parcel.phoneNumber || '',
          deliveryStartTime: parcel.deliveryStartTime?.toISOString() || '',
          deliveryEndTime: parcel.deliveryEndTime?.toISOString() || '',
          pickupLatitude: parcel.pickupLocation?.coordinates?.[1]?.toString() || '',
          pickupLongitude: parcel.pickupLocation?.coordinates?.[0]?.toString() || '',
          deliveryLatitude: parcel.deliveryLocation?.coordinates?.[1]?.toString() || '',
          deliveryLongitude: parcel.deliveryLocation?.coordinates?.[0]?.toString() || '',
        },
        token: deviceToken.fcmToken,
      };

      try {
        await admin.messaging().send(pushPayload);
        console.log(`✅ Push notification sent to assigned deliverer: ${deviceToken.fcmToken}`);
      } catch (err) {
        console.error(`❌ Push notification failed to deliverer ${deviceToken.fcmToken}:`, err);
      }
    } else {
      console.log(`⚠️ No FCM token found for deliverer: ${delivererId}`);
    }

    // Save notification to DB
    const notification = new Notification({
      message: `You have been assigned to deliver the parcel titled "${parcel.title}".`,
      type: 'Accepted',
      title: parcel.title,
      description: parcel.description || '',
      price: parcel.price || '',
      requestId: parcel._id,
      userId: deliverer?._id,
      mobileNumber: sender?.mobileNumber,
      phoneNumber: parcel?.phoneNumber,
      SenderName: sender?.fullName || 'Unknown Sender',
      role: deliverer?.role,
      deliveryStartTime: parcel.deliveryStartTime,
      deliveryEndTime: parcel.deliveryEndTime,
      pickupLocation: {
        latitude: parcel.pickupLocation?.coordinates[1],
        longitude: parcel.pickupLocation?.coordinates[0],
      },
      deliveryLocation: {
        latitude: parcel.deliveryLocation?.coordinates[1],
        longitude: parcel.deliveryLocation?.coordinates[0],
      },
      isRead: false,
      createdAt: new Date(),
      localCreatedAt: moment().tz('Asia/Dhaka').format('YYYY-MM-DD hh:mm A')
    });

    await notification.save();

    res.status(200).json({
      status: "success",
      message: "Delivery man assigned successfully",
    });
  } catch (error) {
    console.error('Error in assignDeliveryMan:', error);
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
    parcel.assignedDelivererId; 
    await parcel.save();

  
    parcel.deliveryRequests = [];
    await parcel.save();
    // 🚀 End Notification Logi
    const senderUser = await User.findById(parcel.senderId);
    

    // Fix role enum spelling if necessary
    if (senderUser && senderUser.role === UserRole.SENDER) {
      senderUser.role = UserRole.RECCIVER; 
      await senderUser.save();
    }

    // Fetch sender for notification meta info
    const sender = await User.findById(parcel.senderId);

    // ✅ Get FCM token from DeviceToken collection (like in createParcelRequest)
    const deviceToken = await DeviceToken.findOne({
      userId: senderUser?._id,
      fcmToken: { $exists: true, $ne: '' }
    });

    if (deviceToken?.fcmToken) {
      const notificationMessage = `You have been assigned to deliver the parcel "${parcel.title}".`;
      
      const pushPayload = {
        notification: {
          title: parcel.title,
          body: notificationMessage,
        },
        data: {
          type: 'Accepted',
          title: parcel.title,
          message: notificationMessage,
          parcelId: parcel._id.toString(),
          price: String(parcel.price || ''),
          description: parcel.description || '',
          phoneNumber: parcel.phoneNumber || '',
          deliveryStartTime: parcel.deliveryStartTime?.toISOString() || '',
          deliveryEndTime: parcel.deliveryEndTime?.toISOString() || '',
          pickupLatitude: parcel.pickupLocation?.coordinates?.[1]?.toString() || '',
          pickupLongitude: parcel.pickupLocation?.coordinates?.[0]?.toString() || '',
          deliveryLatitude: parcel.deliveryLocation?.coordinates?.[1]?.toString() || '',
          deliveryLongitude: parcel.deliveryLocation?.coordinates?.[0]?.toString() || '',
        },
        token: deviceToken.fcmToken,
      };

      try {
        await admin.messaging().send(pushPayload);
        console.log(`✅ Push notification sent to assigned deliverer: ${deviceToken.fcmToken}`);
      } catch (err) {
        console.error(`❌ Push notification failed to deliverer ${deviceToken.fcmToken}:`, err);
      }
    } else {
      console.log(`⚠️ No FCM token found for deliverer: ${senderUser?._id}`);
    }
    

    const notification = new Notification({
      message: `${senderUser?.role === UserRole.RECCIVER ? 'A deliverer has requested' : 'A user has requested'} to deliver your parcel titled "${parcel.title}".`,
      type: 'Cancelled',
      title: `"${parcel.title} "`,
      description: parcel.description || '',
      parcelTitle: parcel.title || '',
      price: parcel.price || '',
      requestId: parcel._id,
      userId: senderUser?._id,
      image: senderUser?.image || 'https://i.ibb.co/z5YHLV9/profile.png',
      AvgRating: senderUser?.avgRating || 0,
      SenderName: senderUser?.fullName || '',
      mobileNumber: senderUser?.mobileNumber || ' ',
      deliveryStartTime: parcel.deliveryStartTime,
      deliveryEndTime: parcel.deliveryEndTime,
      pickupLocation: {
        latitude: parcel.pickupLocation?.coordinates[1],
        longitude: parcel.pickupLocation?.coordinates[0]
      },
      deliveryLocation: {
        latitude: parcel.deliveryLocation?.coordinates[1],
        longitude: parcel.deliveryLocation?.coordinates[0]
      }
      
    });

    await notification.save();

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

    // Ensure only the delivery man can cancel the delivery man
    if (!parcel.assignedDelivererId || parcel.assignedDelivererId.toString() !== userId) {
      throw new AppError("Only the DeliveryMan can cancel the assigned Parcel", 403);
    }

    // Revert parcel status to `PENDING` and clear assigned delivery man
    parcel.status = DeliveryStatus.PENDING;
    parcel.assignedDelivererId = null; 
    await parcel.save();

  
    parcel.deliveryRequests = [];
    await parcel.save();
    // 🚀 End Notification
    const DeliveryMan = await User.findById(parcel.receiverId);
    if (DeliveryMan?.fcmToken) {
      const senderMessage = {
        notification: {
          title: 'cancelled parcel Delivery Man',
          body: `${DeliveryMan.role === UserRole.RECCIVER ? 'A deliverery has cancelled' : 'A user has cancelled'} parcel title "${parcel.title}".`,
          mobileNumber: DeliveryMan.mobileNumber || 'Unknown Number',
          image:DeliveryMan.image || 'https://i.ibb.co/z5YHLV9/profile.png',
          AvgRating: DeliveryMan.avgRating || 0,
          deliveryStartTime: parcel.deliveryStartTime,
          deliveryEndTime: parcel.deliveryEndTime,
        },
        token: DeliveryMan.fcmToken,
      };

      try {
        await admin.messaging().send(senderMessage);
        console.log('Push notification sent to sender.');
      } catch (err) {
        console.error('Error sending push notification to sender:', err);
      }
    }

    const notification = new Notification({
      message: `${DeliveryMan?.role === UserRole.RECCIVER ? 'A delivery has cancelled' : 'A user has cancelled'} parcel titled "${parcel.title}".`,
      type: 'Recciver',
      title: `"${DeliveryMan?.fullName} cancelled the delivery"`,
      description: parcel.description || '',
      parcelTitle: parcel.title || '',
      price: parcel.price || '',
      requestId: parcel._id,
      userId: DeliveryMan?._id,
      image: DeliveryMan?.image || 'https://i.ibb.co/z5YHLV9/profile.png',
      AvgRating: DeliveryMan?.avgRating || 0,
      SenderName: DeliveryMan?.fullName || '',
      mobileNumber: DeliveryMan?.mobileNumber || ' ',
      deliveryStartTime: parcel.deliveryStartTime,
      deliveryEndTime: parcel.deliveryEndTime,
      pickupLocation: {
        latitude: parcel.pickupLocation?.coordinates[1],
        longitude: parcel.pickupLocation?.coordinates[0]
      },
      deliveryLocation: { 
        latitude: parcel.deliveryLocation?.coordinates[1],
        longitude: parcel.deliveryLocation?.coordinates[0]
      }



      
    });

    await notification.save();
    

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
    if (deliverer && deliverer.role === UserRole.RECCIVER) {
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

    // Find the sender user
    const sender = await User.findById(parcel.senderId);
    if (!sender) throw new AppError('Sender user not found', 404);

    // Find the deliverer user
    const deliverer = await User.findById(delivererId);
    if (!deliverer) throw new AppError('Deliverer user not found', 404);

if (status === DeliveryStatus.DELIVERED) {
  // Find the deliverer user
  const deliverer = await User.findById(delivererId);
  console.log('Deliverer before update:', deliverer);
  if (!deliverer) throw new AppError('Deliverer user not found', 404);

  deliverer.totalDelivered = (deliverer.totalDelivered || 0) + 1;
  deliverer.totalEarning = (deliverer.totalEarning || 0) + parcel.price;
  deliverer.monthlyEarnings = (deliverer.monthlyEarnings || 0) + parcel.price;
  
  // console.log('Deliverer stats after increment:', {
  //   totalDelivered: deliverer.totalDelivered,
  //   totalEarning: deliverer.totalEarning,
  //   monthlyEarnings: deliverer.monthlyEarnings,
  // });

  await deliverer.save();
  console.log('Deliverer saved successfully');
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

export const updateGlobalFreeDeliveries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { freeDeliveries } = req.body;

    if (freeDeliveries === undefined) {
       res.status(400).json({ message: "Free deliveries value is required" });
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
export const assignFreeDeliveriesToUser =async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userIds, freeDeliveries } = req.body;

    if (!userIds || userIds.length === 0) {
       res.status(400).json({ message: "User IDs are required" });
    }

    if (freeDeliveries === undefined) {
       res.status(400).json({ message: "Free deliveries value is required" });
    }

    // Assign free deliveries to specific users
    const updatedUsers = await User.updateMany(
      { _id: { $in: userIds } },  // Find users by their IDs
      { freeDeliveries }  // Update the free deliveries for them
    );

    // Use `modifiedCount` instead of `nModified`
    if (updatedUsers.modifiedCount === 0) {
       res.status(404).json({ message: "No users found with the provided IDs" });
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

    if (!parcelId || !rating ||  !targetUserId) {
      throw new AppError("Parcel ID, rating, review, and target user ID are required", 400);
    }

    // Validate rating and review
    if (rating < 1 || rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    // if (review.trim().length > 500) {
    //   throw new AppError("Review text cannot exceed 500 characters", 400);
    // }

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

