import { Router } from 'express';
import { getPageBySlug, getAllPages } from '../controllers/page.controller.js';

const router = Router();

router.get('/', getAllPages);
router.get('/:slug', getPageBySlug);

export default router;
