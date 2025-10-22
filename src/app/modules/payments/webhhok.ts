import { NextFunction, Request, Response } from "express";
import Stripe from "stripe";
import { User } from "../user/user.model";  // Import User model
import { SubscriptionType } from "../../../types/enums";
import { config } from "../../../config";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || " ", {
  apiVersion: "2025-02-24.acacia", // Keep the API version as specified
  // Stripe initialization
});


const stripeWebhook =async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let event: Stripe.Event | undefined;

  try {
    // Verify the event signature
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'] as string,
      config.stripe.webhook_secret as string
    );
  } catch (error) {
    // Ensure we only send the response once
     res.status(400).send(`Webhook signature verification failed. ${error}`);
  }

  if (!event) {
     res.status(500).send(`Invalid event received!`);
  }

  const eventType = event?.type;

  try {
    // Handle the event based on its type
    switch (eventType) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const user = await User.findOne({email: session.customer_details?.email});

        if (user?.email) {
          user.isSubscribed = true;
          user.subscriptionType = user?.subscriptionType || "Basic";
          user.subscriptionPrice = (session.amount_total ?? 0) / 100;
          user.subscriptionStartDate = new Date();
          user.subscriptionExpiryDate = new Date(new Date().setMonth(new Date().getMonth() + 1));
          user.subscriptionCount += 1;
          await user.save();
        }

        break;

      default:
         res.status(500).send(`Unhandled event type: ${eventType}`);
    }
  } catch (error) {
     res.status(500).send(`Error handling event: ${error}`);
  }
  res.sendStatus(200);
};

export default stripeWebhook;