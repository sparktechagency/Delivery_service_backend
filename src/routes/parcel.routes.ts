// routes/parcel.routes.ts
import express from 'express';
import { authenticate } from '../app/middlewares/auth';
import { createParcelRequest, getAvailableParcels, getParcelWithDeliveryRequests } from '../app/modules/controllers/parcel.controller';

const parcelRouter = express.Router();
parcelRouter.post('/create', authenticate, createParcelRequest);
parcelRouter.get('/available', authenticate, getAvailableParcels);
parcelRouter.get('/:parcelId/requests', getParcelWithDeliveryRequests);
export default parcelRouter;
