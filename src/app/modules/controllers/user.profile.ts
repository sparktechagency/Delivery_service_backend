import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth";
import { AppError } from "../../middlewares/error";
import { User } from "../../models/user.model";

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id; // Logged-in user
      const { name, email, socialLinks } = req.body;
  
    
      const user = await User.findById(userId);
      if (!user) throw new AppError('User not found', 404);
  
      // Allow users to update only their own profile
      user.fullName = name || user.fullName;
      user.email = email || user.email;
      user.socialLinks = socialLinks || user.socialLinks;
  
      await user.save();
  
      res.status(200).json({ status: 'success', message: 'Profile updated successfully', data: user });
    } catch (error) {
      next(error);
    }
  };
  
  export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id; // Logged-in user ID

        // Fetch user details
        const user = await User.findById(userId).select("-password"); // Exclude password for security
        if (!user) throw new AppError("User not found", 404);

        res.status(200).json({ 
            status: "success", 
            message: "User profile fetched successfully", 
            data: user 
        });
    } catch (error) {
        next(error);
    }
};