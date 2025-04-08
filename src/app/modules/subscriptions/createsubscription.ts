import { NextFunction, Request, Response } from "express";
import { BaseSubscription, GlobalSubscription, UserSubscription } from "./subscription.model";
import { User } from "../user/user.model";
import { SubscriptionType } from "../../../types/enums";
import { Subscription } from "../../models/subscription.model";
import { GlobalTrial } from "./trial.model";


// export const createGlobalSubscriptionPlan = async (req: Request, res: Response) => {
//   try {
//     const { 
//       type, 
//       price, 
//       freeDeliveries, 
//       totalDeliveries, 
//       totalOrders,  // New field added
//       earnings, 
//       version, 
//       description,
//       deliveryLimit

//     } = req.body;

//     // Log the request body to verify description is passed
//     console.log("Request Body:", req.body);

//     // Validate if version and description are provided
//     if (!version) {
//       return res.status(400).json({ message: "Subscription version is required." });
//     }

//     // Check if a plan with the same type and version already exists
//     const existingPlan = await GlobalSubscription.findOne({ type, version });
//     if (existingPlan) {
//       return res.status(400).json({ message: `The subscription plan '${type}' with version '${version}' already exists` });
//     }

//     // Create the global subscription plan manually before saving to check if description is passed correctly
//     const newSubscriptionPlan = new GlobalSubscription({
//       type,
//       price,
//       freeDeliveries: freeDeliveries ?? 3,
//       totalDeliveries: totalDeliveries ?? 0,
//       totalOrders: totalOrders ?? 0,  // Added with default of 0
//       earnings: earnings ?? 0,
//       version,
//       description: description,
//       deliveryLimit: deliveryLimit ?? 0,
//       isTrial: false,
//     });

//     console.log("Created Subscription Plan:", newSubscriptionPlan);  // Log before saving to verify description

//     await newSubscriptionPlan.save(); // Save the plan

//     res.status(201).json({
//       message: `Global subscription plan '${type}' version '${version}' created successfully`,
//       data: newSubscriptionPlan
//     });
//   } catch (error) {
//     console.error("Error creating global subscription plan:", error);
//     res.status(500).json({ message: "Error creating global subscription plan", error });
//   }
// };

export const createGlobalSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const { 
      type, 
      price, 
      freeDeliveries, 
      totalDeliveries, 
      totalOrders,  // New field added
      earnings, 
      version, 
      description,
      deliveryLimit,
      trialPeriod, // New field for global trial period (in days)
    } = req.body;

    if (!version) {
      return res.status(400).json({ message: "Subscription version is required." });
    }

    // Check if a plan with the same type and version already exists
    const existingPlan = await GlobalSubscription.findOne({ type, version });
    if (existingPlan) {
      return res.status(400).json({ message: `The subscription plan '${type}' with version '${version}' already exists` });
    }

    const newSubscriptionPlan = new GlobalSubscription({
      type,
      price,
      freeDeliveries: freeDeliveries ?? 3,
      totalDeliveries: totalDeliveries ?? 0,
      totalOrders: totalOrders ?? 0,  // Added with default of 0
      earnings: earnings ?? 0,
      version,
      description,
      deliveryLimit: deliveryLimit ?? 0,
      isTrial: false,
      trialPeriod: trialPeriod ?? 30, // Default to 30 days if not provided
      trialActive: true, // Activate the global trial by default
    });

    await newSubscriptionPlan.save();

    res.status(201).json({
      message: `Global subscription plan '${type}' version '${version}' created successfully`,
      data: newSubscriptionPlan
    });
  } catch (error) {
    console.error("Error creating global subscription plan:", error);
    res.status(500).json({ message: "Error creating global subscription plan", error });
  }
};


// export const assignUserSubscription = async (req: Request, res: Response) => {
//   try {
//     const { userId, subscriptionType } = req.body; // Get userId and subscriptionType (e.g. "Enterprise")

//     if (!userId || !subscriptionType) {
//       return res.status(400).json({ message: "User ID and subscription type are required" });
//     }

//     // Find the user
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Get the selected subscription plan from GlobalSubscription
//     const subscriptionPlan = await GlobalSubscription.findOne({ type: subscriptionType });
//     if (!subscriptionPlan) {
//       return res.status(404).json({ message: `Subscription plan '${subscriptionType}' not found` });
//     }

//     // Assign subscription details to the user
//     user.subscriptionType = subscriptionPlan.type;
//     user.subscriptionPrice = subscriptionPlan.price;
//     user.subscriptionCount += 1; // Increment subscription count
//     user.subscriptionStartDate = new Date(); // Set the current date as the start date
//     user.subscriptionExpiryDate = new Date(new Date().setMonth(new Date().getMonth() + 1)); // Set expiry date (1 month)
//     user.isSubscribed = true; // Mark user as subscribed
//     user.freeDeliveries = subscriptionPlan.freeDeliveries; // Set the free deliveries from the global plan

//     await user.save(); // Save the updated user

//     res.status(200).json({
//       message: "User subscription updated successfully",
//      data: user
//     });

//   } catch (error) {
//     console.error("Error assigning subscription to user:", error);
//     res.status(500).json({ message: "Error assigning subscription", error });
//   }
// };




// ✅ Admin Can Update Global Subscription Plan Price and Description


export const assignUserSubscription = async (req: Request, res: Response) => {
  try {
    const { userId, subscriptionType } = req.body; // Assuming userId and subscriptionType are provided

    if (!userId || !subscriptionType) {
      return res.status(400).json({ message: "User ID and subscription type are required" });
    }

    // Find the global trial setting
    const globalTrialSetting = await GlobalTrial.findOne();

    if (!globalTrialSetting || !globalTrialSetting.trialActive) {
      return res.status(400).json({
        message: "Global trial is not active"
      });
    }

    // Create or update user subscription
    const userSubscription = new UserSubscription({
      userId,
      subscriptionType,
      subscriptionPrice: 25.99, // Example price; should be fetched from the plan details
      subscriptionStartDate: new Date(),
      subscriptionCount: 1, // Increment subscription count
      isSubscribed: true,
    });

    // Apply the global trial period to the subscription
    userSubscription.expiryDate = new Date(new Date().setDate(new Date().getDate() + globalTrialSetting.trialPeriod)); // Set expiry based on global trial period
    userSubscription.isTrial = true; // Mark user as being in trial

    await userSubscription.save();

    res.status(200).json({
      message: "User subscription updated successfully",
      data: userSubscription
    });

  } catch (error) {
    console.error("Error assigning subscription to user:", error);
    res.status(500).json({ message: "Error assigning subscription", error });
  }
};

export const setGlobalTrialPeriod = async (req: Request, res: Response) => {
  try {
    const { trialPeriod } = req.body; // Accept trialPeriod from admin input

    if (!trialPeriod || trialPeriod <= 0) {
      return res.status(400).json({ message: "Trial period must be a positive number" });
    }

    // Update the global trial setting
    let globalTrialSetting = await GlobalTrial.findOne(); // There should only be one global trial setting

    if (!globalTrialSetting) {
      // If the setting does not exist, create it
      globalTrialSetting = new GlobalTrial({
        trialPeriod,
        trialActive: true,
      });
    } else {
      globalTrialSetting.trialPeriod = trialPeriod;
      globalTrialSetting.trialActive = true; // Activate the trial globally
    }

    await globalTrialSetting.save();

    res.status(200).json({
      message: `Global trial period set to ${trialPeriod} days`,
      data: globalTrialSetting,
    });
  } catch (error) {
    console.error("Error setting global trial period:", error);
    res.status(500).json({ message: "Error setting global trial period", error });
  }
};

export const getGlobalTrialDetailsForAdmin = async (req: Request, res: Response) => {
  try {
    // Fetch the global trial setting
    const globalTrialSetting = await GlobalTrial.findOne();

    if (!globalTrialSetting) {
      return res.status(404).json({ message: "Global trial setting not found" });
    }

    // Calculate the trial end date by adding the trial period to the trial start date
    const currentDate = new Date();
    const trialStartDate = globalTrialSetting.trialStartDate;
    const trialPeriod = globalTrialSetting.trialPeriod;

    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialStartDate.getDate() + trialPeriod); // Add the trial period to the start date

    // If the trial period has expired
    if (currentDate >= trialEndDate) {
      return res.status(200).json({
        message: "Global trial period has ended",
        trialStartDate: trialStartDate,
        trialEndDate: trialEndDate,
        remainingDays: 0
      });
    }

    // Calculate the remaining days in the trial
    const remainingTime = trialEndDate.getTime() - currentDate.getTime();
    const remainingDays = Math.ceil(remainingTime / (1000 * 3600 * 24)); // Convert milliseconds to days

    res.status(200).json({
      message: "Global trial period remaining",
      trialStartDate: trialStartDate, // Show the trial start date
      trialEndDate: trialEndDate, // Show the trial end date
      remainingDays: remainingDays // Show remaining days in the trial period
    });
  } catch (error) {
    console.error("Error calculating global trial details:", error);
    res.status(500).json({ message: "Error calculating global trial details", error });
  }
};

export const updateSubscriptionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;  // Extract the subscription ID from the URL parameters
    const { type, price, freeParcels, description, deliveryLimit, expiryDate } = req.body; // Extract the fields to update

    // Log the received ID and request body (optional for debugging)
    console.log("Subscription ID to Update:", id);
    console.log("Updated Request Body:", req.body);

    // Find the subscription plan by its ID
    const subscription = await Subscription.findById(id);

    if (!subscription) {
      return res.status(404).json({
        message: `Subscription with ID '${id}' not found.`
      });
    }

    // Update the subscription fields with the provided data
    subscription.type = type ?? subscription.type;
    subscription.price = price ?? subscription.price;
    subscription.freeParcels = freeParcels ?? subscription.freeParcels;
    subscription.description = description ?? subscription.description;
    subscription.deliveryLimit = deliveryLimit ?? subscription.deliveryLimit;
    subscription.expiryDate = expiryDate ?? subscription.expiryDate;

    // Save the updated subscription
    await subscription.save();

    // Respond with the updated subscription data
    res.status(200).json({
      message: `Subscription with ID '${id}' updated successfully.`,
      data: subscription
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({
      message: "Error updating subscription",
      error
    });
  }
};


// ✅ Get All Global Subscription Plans
export const getAllGlobalSubscriptions = async (req: Request, res: Response) => {
  try {
    // Retrieve all global subscription plans
    const globalSubscriptions = await GlobalSubscription.find();

    if (globalSubscriptions.length === 0) {
      return res.status(200).json({ 
        message: "No global subscription plans found.",
        data: globalSubscriptions
       });
    }

    res.status(200).json({
      message: "Global subscription plans retrieved successfully",
      data: globalSubscriptions
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

export const deleteSubscriptionById = async (req: Request, res: Response) => {
  try {
    // Extract the subscription ID from the request parameters
    const { id } = req.params;  // Assuming the subscription ID is passed as a URL parameter
    
    // Log the received ID (optional for debugging)
    console.log("Subscription ID to Delete:", id);

    // Check if the subscription with the given ID exists
    const subscriptionToDelete = await Subscription.findById(id);

    if (!subscriptionToDelete) {
      return res.status(404).json({
        message: `Subscription with ID '${id}' not found.`
      });
    }

    // Delete the subscription from the database
    await Subscription.deleteOne({ _id: id });

    // Respond with a success message
    res.status(200).json({
      message: `Subscription with ID '${id}' deleted successfully.`
    });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    res.status(500).json({
      message: "Error deleting subscription",
      error
    });
  }
};