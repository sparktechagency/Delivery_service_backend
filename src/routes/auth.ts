
import express from 'express';
import { register, verifyOTP, login, forgotPassword, resetPassword, registerWithEmail, loginWithEmailOTP, verifyEmailOTP, verifyLoginOTP } from '../app/modules/controllers/auth.controllers';

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/register-email',registerWithEmail);
router.post('/verify-otp-email',verifyEmailOTP);
router.post('/login-email',loginWithEmailOTP);
router.post('/login-email',loginWithEmailOTP);
router.post('/verify-login-otp', verifyLoginOTP);

export default router;