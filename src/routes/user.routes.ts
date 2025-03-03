import express from "express";
import { authenticate } from "../app/middlewares/auth";
import { getProfile, updateProfile } from "../app/modules/controllers/user.profile";

const userRoutesProfile = express.Router();

userRoutesProfile.get("/profile", authenticate, getProfile); // ✅ GET user profile
userRoutesProfile.put("/profile", authenticate, updateProfile); // ✅ Update user profile

export default userRoutesProfile;
