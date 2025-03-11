import { Request, Response } from "express";
import Stripe from "stripe";
import { User } from "../user/user.model";  // Import User model
import { SubscriptionType } from "../../../types/enums";
import { config } from "../../../config";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || " ", {
  apiVersion: "2025-02-24.acacia", // Keep the API version as specified
  // Stripe initialization
});


//   export const stripeWebhook = async (req: Request, res: Response) => {
//     const sig = req.headers['stripe-signature'];
//     const endpointSecret = 'your-webhook-signing-secret'; // You get this from your Stripe Dashboard

//     // Check if signature exists
//     if (!sig) {
//       console.error("Stripe signature is missing!");
//       return res.status(400).send("Webhook Error: Missing signature");
//     }

//     let event;

//     try {
//       event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//     } catch (err) {
//       if (err instanceof Error) {
//         console.error(`Webhook Error: ${err.message}`);
//         return res.status(400).send(`Webhook Error: ${err.message}`);
//       } else {
//         console.error("Unknown error occurred:", err);
//         return res.status(400).send("Webhook Error: Unknown error");
//       }
//     }

//     // Handle checkout.session.completed event
//     if (event.type === "checkout.session.completed") {
//       const session = event.data.object as Stripe.Checkout.Session;

//       // Safely handle `line_items` for subscription info
//       const subscriptionType = session.line_items?.data[0]?.description || "Unknown"; // Default to "Unknown" if no description

//       // Cast the string to SubscriptionType enum
//       const validSubscriptionType = subscriptionType as SubscriptionType; // Cast to SubscriptionType

//       const userId = session.client_reference_id; // Retrieve the user ID from the session
//       const user = await User.findById(userId);

//       if (user) {
//         user.isSubscribed = true;
//         user.subscriptionType = validSubscriptionType; // Assign the subscription type
//         user.subscriptionPrice = (session.amount_total ?? 0) / 100; // Convert cents to dollars
//         user.subscriptionStartDate = new Date();
//         user.subscriptionExpiryDate = new Date(new Date().setMonth(new Date().getMonth() + 1)); // Set expiry to 1 month
//         user.subscriptionCount += 1; // Increment subscription count
//         await user.save();
//       }
//     }

//     res.status(200).json({ received: true });
//   };



// Handle Stripe webhook


/* export const stripeWebhook = async (req: Request, res: Response) => {

  let event: Event =  


  const sig = req.headers['stripe-signature'];
  const endpointSecret = 'whsec_4f193ea14b486746209c16e2eddcf9c6d6f41c8ab1b1043feeb40153db89c6e8';

  // Check if signature exists
  if (!sig) {
    console.error("Stripe signature is missing!");
    return res.status(400).send("Webhook Error: Missing signature");
  }

  let event;

  try {
    // Use the raw body (req.body is already raw due to express.raw())
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    } else {
      console.error("Unknown error occurred:", err);
      return res.status(400).send("Webhook Error: Unknown error");
    }
  }

  // Handle checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Safely handle `line_items` for subscription info
    const subscriptionTypeString = session.line_items?.data[0]?.description || "Unknown"; // Default to "Unknown" if no description

    // Cast the subscription type string to SubscriptionType enum
    const subscriptionType = subscriptionTypeString as SubscriptionType; // Cast to SubscriptionType enum

    const userId = session.client_reference_id; // Retrieve the user ID from the session
    const user = await User.findById(userId);

    if (user) {
      user.isSubscribed = true;
      user.subscriptionType = subscriptionType;  // Assign the subscription type
      user.subscriptionPrice = (session.amount_total ?? 0) / 100; // Convert from cents to dollars
      user.subscriptionStartDate = new Date();
      user.subscriptionExpiryDate = new Date(new Date().setMonth(new Date().getMonth() + 1)); // Set expiry to 1 month
      user.subscriptionCount += 1; // Increment subscription count
      await user.save();
    }
  }

  res.status(200).json({ received: true });
}; */


const stripeWebhook = async (req: Request, res: Response) => {
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
    return res.status(400).send(`Webhook signature verification failed. ${error}`);
  }

  if (!event) {
    return res.status(500).send(`Invalid event received!`);
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
        return res.status(500).send(`Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    return res.status(500).send(`Error handling event: ${error}`);
  }
  res.sendStatus(200);
};

export default stripeWebhook;