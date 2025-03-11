import { Request, Response } from 'express';
import { User } from "../user/user.model";  // Import User model
import { GlobalSubscription } from "../subscriptions/subscription.model"; // Import GlobalSubscription to get plan details
import Stripe from "stripe";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || " ", {
    apiVersion: "2025-02-24.acacia", // Keep the API version as specified
    // Stripe initialization
  });
// ✅ Create Stripe Checkout Session
export const createCheckoutSession = async (req: Request, res: Response) => {
    try {
      const { userId, subscriptionType } = req.body;
  
      // Validate required fields
      if (!userId || !subscriptionType) {
        return res.status(400).json({ message: "User ID and subscription type are required" });
      }
  
      // Find the selected global subscription plan
      const globalPlan = await GlobalSubscription.findOne({ type: subscriptionType });
      if (!globalPlan) {
        return res.status(404).json({ message: `Global subscription plan '${subscriptionType}' not found` });
      }
  
      // Get the user's details
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Create a Stripe Checkout session for recurring payments
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Subscription to ${subscriptionType}`,
              },
              recurring: {
                interval: 'month', // Recurring payment every month
              },
              unit_amount: globalPlan.price * 100, // Convert price to cents
            },
            quantity: 1,
          },
        ],
        customer_email: user.email,
        mode: 'subscription', // Use subscription mode for recurring payments
        success_url: `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`, // Ensure BASE_URL is set
        cancel_url: `${process.env.BASE_URL}/cancel`, // Ensure BASE_URL is set
        client_reference_id: userId,  // Link the session with the user ID
      });
  
      // Return the session URL for redirecting to payment page
      res.status(200).json({ url: session.url });
  
    } catch (error) {
      console.error("Error creating Stripe session:", error);
      res.status(500).json({ message: "Error creating Stripe checkout session", error });
    }
  };


