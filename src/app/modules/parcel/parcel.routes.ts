// routes/parcel.routes.ts
import express from 'express';
import { authenticate } from '../../middlewares/auth';
import { createParcelRequest, getAvailableParcels, getParcelsByRadius, getParcelWithDeliveryRequests, getUserParcels } from './parcel.controller';
import upload from '../../../multer/multer';
import { assignDeliveryMan, cancelAssignedDeliveryMan, removeDeliveryRequest } from './delivery.controller';

const parcelRouter = express.Router();
// parcelRouter.post('/create', authenticate, createParcelRequest);
parcelRouter.post("/create",authenticate, upload.array('images', 5), createParcelRequest);// ✅ Allow up to 5 images
parcelRouter.get('/available', authenticate, getAvailableParcels);
parcelRouter.get("/user-parcels", authenticate, getUserParcels);
parcelRouter.get('/availableByRadius', authenticate,getParcelsByRadius );
parcelRouter.get('/:parcelId/requests', getParcelWithDeliveryRequests);
parcelRouter.put("/assign", authenticate, assignDeliveryMan);
parcelRouter.put("/cancel-assignment", authenticate, cancelAssignedDeliveryMan);
parcelRouter.put('/remove-request',authenticate, removeDeliveryRequest )

export default parcelRouter;

// router.post('/parcel', createParcelRequest);
