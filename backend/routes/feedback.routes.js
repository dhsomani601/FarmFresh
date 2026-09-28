import { Router } from 'express';
import { submitFeedback, getAllFeedbacks } from '../controllers/feedback.controller.js';
import { adminAuth } from '../controllers/admin.controller.js';

const router = Router();

// Public feedback submission
router.post('/', submitFeedback);

// Admin-only feedback retrieval
router.get('/', adminAuth, getAllFeedbacks);

export default router;
