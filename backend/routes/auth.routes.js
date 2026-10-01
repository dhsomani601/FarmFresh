import { Router } from 'express';
import { 
  register, 
  login, 
  logout,
  getMe, 
  updateProfile, 
  requestOtp, 
  verifyOtpAndChangePassword,
  requestRegisterOtp,
  verifyRegisterOtp
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/register-otp', requestRegisterOtp);
router.post('/verify-register-otp', verifyRegisterOtp);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.post('/request-otp', requestOtp);
router.post('/verify-otp-password', verifyOtpAndChangePassword);

export default router;
