import express from 'express';
import  {register,verifyOTP,login}  from './auth.controllers';

const router = express.Router();
// const authController = new AuthController();

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);

export default router;