
import express from 'express';
import { register, verifyOTP, login, forgotPassword, resetPassword } from '../app/modules/controllers/auth.controllers';

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


export default router;