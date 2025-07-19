import { NextFunction, Request, Response } from "express";
import { BaseSubscription, GlobalSubscription, UserSubscription } from "./subscription.model";
import { User } from "../user/user.model";
import { SubscriptionType } from "../../../types/enums";
import { Subscription } from "../../models/subscription.model";
import { GlobalTrial } from "./trial.model";


export const createGlobalSubscriptionPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      type, 
      price, 
      freeDeliveries, 
      totalDeliveries, 
      totalOrders,
      earnings, 
      version, 
      description,
      deliveryLimit,
      trialPeriod, 
    } = req.body;

    if (!version) {
       res.status(400).json({ message: "Subscription version is required." });
       return;
    }

    // Check if a plan with the same type and version already exists
    const existingPlan = await GlobalSubscription.findOne({ type, version });
    if (existingPlan) {
       res.status(400).json({ message: `The subscription plan '${type}' with version '${version}' already exists` });
       return;
    }

    const newSubscriptionPlan = new GlobalSubscription({
      type,
      price,
      freeDeliveries: freeDeliveries ?? 3,
      totalDeliveries: totalDeliveries ?? 0,
      totalOrders: totalOrders ?? 0,  
      earnings: earnings ?? 0,
      version,
      description,
      deliveryLimit: deliveryLimit ?? 0,
      isTrial: false,
      trialPeriod: trialPeriod ?? 30, 
      trialActive: true, 
    });

    await newSubscriptionPlan.save();

    res.status(201).json({
      message: `Global subscription plan '${type}' version '${version}' created successfully`,
      data: newSubscriptionPlan
    });
    return;
  } catch (error) {
    console.error("Error creating global subscription plan:", error);
    res.status(500).json({ message: "Error creating global subscription plan", error });
    return;
  }
};


export const assignUserSubscription =async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, subscriptionType } = req.body;

    if (!userId || !subscriptionType) {
       res.status(400).json({ message: "User ID and subscription type are required" });
       return; // Return immediately to prevent further code execution
    }

    const globalTrialSetting = await GlobalTrial.findOne();

    if (!globalTrialSetting || !globalTrialSetting.trialActive) {
       res.status(400).json({
        message: "Global trial is not active"
      });
      return; // Return immediately to prevent further code execution
    }

    // Create or update user subscription
    const userSubscription = new UserSubscription({
      userId,
      subscriptionType,
      subscriptionPrice: 25.99,
      subscriptionStartDate: new Date(),
      subscriptionCount: 1,
      isSubscribed: true,
    });

    userSubscription.expiryDate = new Date(new Date().setDate(new Date().getDate() + globalTrialSetting.trialPeriod));
    userSubscription.isTrial = true;

    await userSubscription.save();

    res.status(200).json({
      message: "User subscription updated successfully",
      data: userSubscription
    });
    return; // Return immediately to prevent further code execution

  } catch (error) {
    console.error("Error assigning subscription to user:", error);
    res.status(500).json({ message: "Error assigning subscription", error });
    return; // Return immediately to prevent further code execution
  }
};


export const setGlobalTrialPeriod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { trialPeriod } = req.body; // Accept trialPeriod from admin input

    if (!trialPeriod || trialPeriod <= 0) {
       res.status(400).json({ message: "Trial period must be a positive number" });
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
      globalTrialSetting.trialActive = true; 
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

export const getGlobalTrialDetailsForAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> =>{
  try {
    // Fetch the global trial setting
    const globalTrialSetting = await GlobalTrial.findOne();

    if (!globalTrialSetting) {
       res.status(404).json({ message: "Global trial setting not found" });
       return;
    }

    const currentDate = new Date();
    const trialStartDate = globalTrialSetting.trialStartDate;
    const trialPeriod = globalTrialSetting.trialPeriod;

    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialStartDate.getDate() + trialPeriod);

    // If the trial period has expired
    if (currentDate >= trialEndDate) {
       res.status(200).json({
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
    return;
  } catch (error) {
    console.error("Error calculating global trial details:", error);
    res.status(500).json({ message: "Error calculating global trial details", error });
  }
  return;
};

export const updateSubscriptionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; 
    const { type, price, freeParcels, description, deliveryLimit, expiryDate } = req.body; // Extract the fields to update

    console.log("Subscription ID to Update:", id);
    console.log("Updated Request Body:", req.body);

    const subscription = await Subscription.findById(id);

    if (!subscription) {
       res.status(404).json({
        message: `Subscription with ID '${id}' not found.`
      });
      return;
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
    return;
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({
      message: "Error updating subscription",
      error
    });
    return;
  }
};


// ✅ Get All Global Subscription Plans
export const getAllGlobalSubscriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Retrieve all global subscription plans
    const globalSubscriptions = await GlobalSubscription.find();

    if (globalSubscriptions.length === 0) {
      res.status(200).json({ 
        message: "No global subscription plans found.",
        data: globalSubscriptions
      });
      return; // Ensure to return here after sending the response to avoid further execution
    }

    res.status(200).json({
      message: "Global subscription plans retrieved successfully",
      data: globalSubscriptions
    });
    return; // Ensure to return here after sending the response to avoid further execution
  } catch (error) {
    console.error("Error fetching global subscription plans:", error);
    res.status(500).json({ message: "Error fetching global subscription plans", error });
    return; // Ensure to return here after sending the response to avoid further execution
  }
};




// ✅ Admin can Update Default Earnings for All Users or Specific User
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
      return;
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
      return;
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
export const checkSubscription =async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId); // Assuming you're passing userId in the body

    if (!user) {
       res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.freeDeliveries <= 0 && !user.isSubscribed) {
      // Auto-disable profile if no free deliveries and not subscribed
      user.isRestricted = true;
      await user.save();
       res.status(400).json({ message: "Your free deliveries are over. Please upgrade your profile." });
       return;
    }

    next(); // Continue to next middleware or endpoint if subscription is valid
  } catch (error) {
    console.error("Error checking subscription:", error);
    res.status(500).json({ message: "Error checking subscription", error });
  }
  return;
};

export const deleteSubscriptionById = async (req: Request, res: Response, next: NextFunction): Promise<void> =>{
  try {
    // Extract the subscription ID from the request parameters
    const { id } = req.params;  // Assuming the subscription ID is passed as a URL parameter
    
    // Log the received ID (optional for debugging)
    console.log("Subscription ID to Delete:", id);

    // Check if the subscription with the given ID exists
    const subscriptionToDelete = await Subscription.findById(id);

    if (!subscriptionToDelete) {
       res.status(404).json({
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
    return;
  }
};