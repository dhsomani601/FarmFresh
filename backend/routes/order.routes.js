import { Router } from 'express';
import { placeOrder, getOrders, getOrderById } from '../controllers/order.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/', placeOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);

export default router;
