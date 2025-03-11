
import express from 'express';
import { createCheckoutSession } from './checkout';


const PaymentRoutes = express.Router();

// Payment routes go here
PaymentRoutes.post("/create-checkout-session", createCheckoutSession);


export default PaymentRoutes;