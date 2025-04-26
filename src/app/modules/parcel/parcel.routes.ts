// routes/parcel.routes.ts
import express from 'express';
import { authenticate } from '../../middlewares/auth';
import { createParcelRequest, getAvailableParcels, getFilteredParcels, getParcelsByRadius, getParcelWithDeliveryRequests, getUserParcels, getUserReviews, updateParcelStatus } from './parcel.controller';
import { assignDeliveryMan, cancelAssignedDeliveryMan, removeDeliveryRequest } from './delivery.controller';
import fileUploadHandler from '../../../multer/multer';
const upload = fileUploadHandler();
const parcelRouter = express.Router();
// parcelRouter.post('/create', authenticate, createParcelRequest);

parcelRouter.post("/create", authenticate, upload, createParcelRequest);
parcelRouter.get('/available', authenticate, getAvailableParcels);
parcelRouter.get("/user-parcels", authenticate, getUserParcels);
parcelRouter.post('/availableByRadius', authenticate,getParcelsByRadius );
parcelRouter.get('/requests/:parcelId', getParcelWithDeliveryRequests);
parcelRouter.get('/get-user-reviews', authenticate, getUserReviews);
parcelRouter.put("/assign", authenticate, assignDeliveryMan);
parcelRouter.put("/cancel-assignment", authenticate, cancelAssignedDeliveryMan);
parcelRouter.put('/remove-request',authenticate, removeDeliveryRequest )
parcelRouter.post('/delivery',authenticate, updateParcelStatus )


//DeliverParcel
parcelRouter.get('/filtered', getFilteredParcels);

export default parcelRouter;

