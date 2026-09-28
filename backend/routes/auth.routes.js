import { Router } from 'express';
import { register, login, getMe, updateProfile, requestOtp, verifyOtpAndChangePassword } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.post('/request-otp', requestOtp);
router.post('/verify-otp-password', verifyOtpAndChangePassword);

export default router;
