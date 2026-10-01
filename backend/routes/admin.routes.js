import { Router } from 'express';
import {
  adminLogin,
  adminLogout,
  adminAuth,
  getAdminSettings,
  updateAdminSettings,
  updateProductStock,
  addProduct,
  deleteProduct,
  updateOrderStatus,
  getDashboard,
  getOrderDetails
} from '../controllers/admin.controller.js';

const router = Router();

// Public admin login & logout
router.post('/login', adminLogin);
router.post('/logout', adminLogout);

// Protected admin routes
router.use(adminAuth);
router.get('/dashboard', getDashboard);
router.get('/settings', getAdminSettings);
router.put('/settings', updateAdminSettings);
router.post('/products', addProduct);
router.put('/products/:id/stock', updateProductStock);
router.delete('/products/:id', deleteProduct);
router.patch('/orders/:id/status', updateOrderStatus);
router.get('/orders/:id', getOrderDetails);

export default router;
