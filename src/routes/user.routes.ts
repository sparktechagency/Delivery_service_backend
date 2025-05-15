import express from "express";
import { authenticate } from "../app/middlewares/auth";
import { getProfile, getSingleProfile, updateProfile,  } from "../app/modules/user/user.profile";
import upload from "../multer/multer";

const userRoutesProfile = express.Router();

userRoutesProfile.get("/profile", authenticate, getProfile); 
userRoutesProfile.get("/single-profile", authenticate, getSingleProfile); 
userRoutesProfile.put('/profile', authenticate, updateProfile);
export default userRoutesProfile;
