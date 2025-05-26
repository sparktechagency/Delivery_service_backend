// delivery.routes.ts
import express from 'express';
import { authenticate } from '../../middlewares/auth';
import { requestToDeliver, acceptDeliveryOffer, updateParcelStatus, postReviewForUser, getReviewsForUser, cancelDeliveryRequest, cancelParcelDelivery } from './delivery.controller';

const deliveryRouter = express.Router();

// POST request to deliver a parcel
deliveryRouter.post('/request-delivery', authenticate, requestToDeliver);


deliveryRouter.post('/accept', authenticate, acceptDeliveryOffer);
deliveryRouter.post('/update-status', authenticate, updateParcelStatus);
deliveryRouter.post('/review', postReviewForUser);
deliveryRouter.post('/cancel-request',authenticate, cancelDeliveryRequest);
deliveryRouter.get('/review/:userId',getReviewsForUser );
deliveryRouter.post('/DevCancelparcel',authenticate,cancelParcelDelivery);




export default deliveryRouter;
