// delivery.routes.ts
import express from 'express';
import { authenticate } from '../app/middlewares/auth';
import { requestToDeliver, acceptDeliveryOffer, updateParcelStatus } from '../app/modules/controllers/delivery.controller';

const deliveryRouter = express.Router();

// POST request to deliver a parcel
deliveryRouter.post('/request', authenticate, requestToDeliver);

// POST request to accept a delivery offer
deliveryRouter.post('/accept', authenticate, acceptDeliveryOffer);
deliveryRouter.post('/update-status', authenticate, updateParcelStatus);

export default deliveryRouter;
