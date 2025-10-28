
// import { NotificationData, Notification } from "../app/modules/notification/notification.model";


// export const sendNotifications = async (data: any): Promise<NotificationData> => {

//     const result = await Notification.create(data);

//     const notification: NotificationData | null = await Notification.findById(result._id)
//         .populate({ path: "sender", select: "name profile" })
//         .select("text sender read referenceId screen createdAt ");

//     //@ts-ignore
//     const socketIo = global.io;

//     if (socketIo) {
//         socketIo.emit(`getNotification::${data?.receiver}`, notification);
//     }

//     return notification;
// }