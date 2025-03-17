
import express from 'express';
import { register, verifyOTP, login,  registerWithEmail, loginWithEmailOTP, verifyEmailOTP, verifyLoginOTP, verifyLoginOTPNumber } from './auth.controllers';

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/login-otp', verifyLoginOTPNumber);
// router.post('/forgot-password', forgotPassword);
// router.post('/reset-password', resetPassword);
router.post('/register-email',registerWithEmail);
router.post('/verify-otp-email',verifyEmailOTP);
router.post('/login-email',loginWithEmailOTP);
router.post('/login-email',loginWithEmailOTP);
router.post('/verify-login-otp', verifyLoginOTP);

export default router;