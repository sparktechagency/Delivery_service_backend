import { NextFunction, Request, Response } from "express";
import { BaseSubscription, GlobalSubscription, UserSubscription } from "./subscription.model";
import { User } from "../user/user.model";
import { SubscriptionType } from "../../../types/enums";

// ✅ Admin Creates a Global Subscription Plan (Without User ID)
// export const createGlobalSubscriptionPlan = async (req: Request, res: Response) => {
//   try {
//     const { type, price, freeDeliveries, totalDeliveries, earnings } = req.body;

//     const existingPlan = await GlobalSubscription.findOne({type: type})
//     if (existingPlan) {
//       return res.status(400).json({ message: "This subscription plan template already exists" });
//     }
    
//     const newSubscriptionPlan = await GlobalSubscription.create({
//       type,
//       price,
//       freeDeliveries: freeDeliveries ?? 3,
//       totalDeliveries: totalDeliveries ?? 0,
//       earnings: earnings ?? 0,
//       isTrial: false
//     })

//     res.status(201).json({
//       message: "Global subscription plan template created successfully",
//       subscription: newSubscriptionPlan
//     })
    
//   } catch (error) {
//     console.error("Error creating global subscription plan:", error);
//     res.status(500).json({ message: "Error creating global subscription plan", error });
//   }
// };


// ✅ Admin Creates a Global Subscription Plan
export const createGlobalSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const { type, price, freeDeliveries, totalDeliveries, earnings } = req.body;

    // Check if the global plan already exists
    const existingPlan = await GlobalSubscription.findOne({ type });
    if (existingPlan) {
      return res.status(400).json({ message: "This subscription plan template already exists" });
    }
    
    // Create the global subscription plan
    const newSubscriptionPlan = await GlobalSubscription.create({
      type, // No need to convert type to lowercase anymore
      price,
      freeDeliveries: freeDeliveries ?? 3,
      totalDeliveries: totalDeliveries ?? 0,
      earnings: earnings ?? 0,
      isTrial: false
    });

    res.status(201).json({
      message: "Global subscription plan template created successfully",
      subscription: newSubscriptionPlan
    });
    
  } catch (error) {
    console.error("Error creating global subscription plan:", error);
    res.status(500).json({ message: "Error creating global subscription plan", error });
  }
};

// ✅ Assign a subscription to a user
// export const assignUserSubscription = async (req: Request, res: Response) => {
//   try {
//     const { userId, subscriptionType } = req.body; // Get userId and subscriptionType

//     // Validate userId
//     if (!userId || !subscriptionType) {
//       return res.status(400).json({ message: "User ID and subscription type are required" });
//     }

//     // Check if user exists
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Get the subscription plan based on the selected subscription type
//     const subscriptionPlan = await GlobalSubscription.findOne({ type: subscriptionType });
//     if (!subscriptionPlan) {
//       return res.status(404).json({ message: `Subscription plan '${subscriptionType}' not found` });
//     }

//     // Update the user's subscription information
//     user.subscriptionType = subscriptionPlan.type;
//     user.subscriptionPrice = subscriptionPlan.price;
//     user.subscriptionCount += 1; // Increment subscription count
//     user.subscriptionStartDate = new Date(); // Set the current date as the start date
//     user.subscriptionExpiryDate = new Date(new Date().setMonth(new Date().getMonth() + 1)); // Set the expiry date (1 month later)
//     user.isSubscribed = true; // Mark the user as subscribed
//     user.freeDeliveries = subscriptionPlan.freeDeliveries; // Update free deliveries based on the plan

//     // Save the updated user document
//     await user.save();

//     res.status(200).json({
//       message: "User subscription updated successfully",
//       user
//     });

//   } catch (error) {
//     console.error("Error assigning user subscription:", error);
//     res.status(500).json({ message: "Error assigning user subscription", error });
//   }
// };

export const assignUserSubscription = async (req: Request, res: Response) => {
  try {
    const { userId, subscriptionType } = req.body; // Get userId and subscriptionType (e.g. "Enterprise")

    if (!userId || !subscriptionType) {
      return res.status(400).json({ message: "User ID and subscription type are required" });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get the selected subscription plan from GlobalSubscription
    const subscriptionPlan = await GlobalSubscription.findOne({ type: subscriptionType });
    if (!subscriptionPlan) {
      return res.status(404).json({ message: `Subscription plan '${subscriptionType}' not found` });
    }

    // Assign subscription details to the user
    user.subscriptionType = subscriptionPlan.type;
    user.subscriptionPrice = subscriptionPlan.price;
    user.subscriptionCount += 1; // Increment subscription count
    user.subscriptionStartDate = new Date(); // Set the current date as the start date
    user.subscriptionExpiryDate = new Date(new Date().setMonth(new Date().getMonth() + 1)); // Set expiry date (1 month)
    user.isSubscribed = true; // Mark user as subscribed
    user.freeDeliveries = subscriptionPlan.freeDeliveries; // Set the free deliveries from the global plan

    await user.save(); // Save the updated user

    res.status(200).json({
      message: "User subscription updated successfully",
      user
    });

  } catch (error) {
    console.error("Error assigning subscription to user:", error);
    res.status(500).json({ message: "Error assigning subscription", error });
  }
};

// ✅ Update User Subscription Plan
// export const updateUserSubscription = async (req: Request, res: Response) => {
//   try {
//     const { userId, type } = req.body;
    
//     if (!userId) {
//       return res.status(400).json({ message: "userId is required" });
//     }

//     // Validate subscription type
//     if (!Object.values(SubscriptionType).includes(type)) {
//       return res.status(400).json({ 
//         message: `Invalid subscription type. Valid types are: ${Object.values(SubscriptionType).join(', ')}` 
//       });
//     }

//     // Get the global plan to copy its properties
//     const globalPlan = await GlobalSubscription.findOne({ 
//       type: type
//     });

//     if (!globalPlan) {
//       return res.status(404).json({ 
//         message: `Global subscription plan for type '${type}' not found` 
//       });
//     }

//     // Find and update the user's subscription
//     const userSubscription = await UserSubscription.findOne({ userId });
    
//     if (!userSubscription) {
//       return res.status(404).json({ message: "User subscription not found" });
//     }

//     // Update with values from the global plan
//     userSubscription.type = globalPlan.type;
//     userSubscription.price = globalPlan.price;
//     userSubscription.freeDeliveries = globalPlan.freeDeliveries;
    
//     // Keep user-specific data
//     // Don't reset totalDeliveries or other user-specific data
    
//     await userSubscription.save();

//     res.status(200).json({ 
//       message: "User subscription updated successfully", 
//       subscription: userSubscription 
//     });
//   } catch (error) {
//     console.error("Error updating user subscription:", error);
//     res.status(500).json({ message: "Error updating user subscription", error });
//   }
// };


// ✅ Admin can Update Global Subscription Plan Pricing
export const updateGlobalSubscriptionPrice = async (req: Request, res: Response) => {
  try {
    const { type, price } = req.body;
    
    if (!type || price === undefined) {
      return res.status(400).json({ message: "Subscription type and price are required" });
    }

    // Validate subscription type (remove toLowerCase())
    if (!Object.values(SubscriptionType).includes(type)) {
      return res.status(400).json({ 
        message: `Invalid subscription type. Valid types are: ${Object.values(SubscriptionType).join(', ')}` 
      });
    }

    // Update the global plan
    const globalPlan = await GlobalSubscription.findOneAndUpdate(
      { type: type }, // Remove toLowerCase here
      { price },
      { new: true }
    );

    if (!globalPlan) {
      return res.status(404).json({ message: "Global subscription plan not found" });
    }

    // Optionally update all user subscriptions of this type
    if (req.body.updateAllUsers) {
      await UserSubscription.updateMany(
        { type: type }, // Remove toLowerCase here
        { price }
      );
    }

    res.status(200).json({ 
      message: req.body.updateAllUsers 
        ? "Global and user subscription prices updated successfully" 
        : "Global subscription price updated successfully",
      globalPlan
    });
  } catch (error) {
    console.error("Error updating subscription price:", error);
    res.status(500).json({ message: "Error updating subscription price", error });
  }
};

// ✅ Get All Global Subscription Plans
export const getAllGlobalSubscriptions = async (req: Request, res: Response) => {
  try {
    // Retrieve all global subscription plans
    const globalSubscriptions = await GlobalSubscription.find();

    if (globalSubscriptions.length === 0) {
      return res.status(404).json({ message: "No global subscription plans found" });
    }

    res.status(200).json({
      message: "Global subscription plans retrieved successfully",
      subscriptions: globalSubscriptions
    });
  } catch (error) {
    console.error("Error fetching global subscription plans:", error);
    res.status(500).json({ message: "Error fetching global subscription plans", error });
  }
};



// // ✅ Admin can Update Default Earnings for All Users or Specific User
export const updateEarnings = async (req: Request, res: Response) => {
  try {
    const { userId, type, earnings } = req.body;

    if (earnings === undefined) {
      return res.status(400).json({ message: "Earnings value is required" });
    }

    if (userId) {
      // Update for a specific user
      const subscription = await UserSubscription.findOneAndUpdate(
        { userId },
        { earnings },
        { new: true }
      );
      
      if (!subscription) {
        return res.status(404).json({ message: "User subscription not found" });
      }
      
      res.status(200).json({ 
        message: "User earnings updated successfully",
        subscription
      });
    } 
    else if (type) {
      // Update the global plan for a specific type
      const globalPlan = await GlobalSubscription.findOneAndUpdate(
        { type: type.toLowerCase() },
        { earnings },
        { new: true }
      );
      
      if (!globalPlan) {
        return res.status(404).json({ message: "Global subscription plan not found" });
      }
      
      // Optionally update all user subscriptions of this type
      if (req.body.updateAllUsers) {
        await UserSubscription.updateMany(
          { type: type.toLowerCase() },
          { earnings }
        );
      }
      
      res.status(200).json({ 
        message: req.body.updateAllUsers 
          ? "Global and user subscription earnings updated successfully" 
          : "Global subscription earnings updated successfully",
        globalPlan
      });
    }
    else {
      // Update all global plans
      await GlobalSubscription.updateMany({}, { earnings });
      
      // Optionally update all user subscriptions
      if (req.body.updateAllUsers) {
        await UserSubscription.updateMany({}, { earnings });
      }
      
      res.status(200).json({ 
        message: req.body.updateAllUsers 
          ? "All global and user subscription earnings updated successfully" 
          : "All global subscription earnings updated successfully"
      });
    }
  } catch (error) {
    console.error("Error updating earnings:", error);
    res.status(500).json({ message: "Error updating earnings", error });
  }
};

// Ensure checkSubscription is correctly exported in the middleware file (auth.ts)
export const checkSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId); // Assuming you're passing userId in the body

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.freeDeliveries <= 0 && !user.isSubscribed) {
      // Auto-disable profile if no free deliveries and not subscribed
      user.isRestricted = true;
      await user.save();
      return res.status(400).json({ message: "Your free deliveries are over. Please upgrade your profile." });
    }

    next(); // Continue to next middleware or endpoint if subscription is valid
  } catch (error) {
    console.error("Error checking subscription:", error);
    res.status(500).json({ message: "Error checking subscription", error });
  }
};
