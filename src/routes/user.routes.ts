import express from "express";
import { authenticate, updateProfileMiddleware } from "../app/middlewares/auth";
import { getProfile, updateProfile } from "../app/modules/user/user.profile";
import upload from "../multer/multer";

const userRoutesProfile = express.Router();

userRoutesProfile.get("/profile", authenticate, getProfile); 
userRoutesProfile.put('/profile', authenticate, upload.single('profileImage'), updateProfileMiddleware);
export default userRoutesProfile;
