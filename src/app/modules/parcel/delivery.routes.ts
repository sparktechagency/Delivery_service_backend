// delivery.routes.ts
import express from 'express';
import { authenticate } from '../../middlewares/auth';
import { requestToDeliver, acceptDeliveryOffer, updateParcelStatus } from './delivery.controller';

const deliveryRouter = express.Router();

// POST request to deliver a parcel
deliveryRouter.post('/request-delivery', authenticate, requestToDeliver);


// POST request to accept a delivery offer
deliveryRouter.post('/accept', authenticate, acceptDeliveryOffer);
// router.put("/assign", authenticate, assignDeliveryMan);
deliveryRouter.post('/update-status', authenticate, updateParcelStatus);


export default deliveryRouter;
// router.post('/parcel', createParcelRequest);
// router.post('/parcel/accept-delivery', acceptDeliveryRequest);
// router.post('/parcel/notify-radius', sendRadiusNotification);