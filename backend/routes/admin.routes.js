import { Router } from 'express';
import {
  adminLogin,
  adminAuth,
  getAdminSettings,
  updateAdminSettings,
  updateProductStock,
  getDashboard,
  getOrderDetails
} from '../controllers/admin.controller.js';

const router = Router();

// Public admin login
router.post('/login', adminLogin);

// Protected admin routes
router.use(adminAuth);
router.get('/dashboard', getDashboard);
router.get('/settings', getAdminSettings);
router.put('/settings', updateAdminSettings);
router.put('/products/:id/stock', updateProductStock);
router.get('/orders/:id', getOrderDetails);

export default router;
