import { Router } from 'express';
import { AIController } from '../controllers/AIController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/stats', requireAuth, requireRole('admin'), AIController.getStats);
router.get('/stats/cache', requireAuth, requireRole('admin'), AIController.getCacheStats);
router.get('/stats/anti-spam', requireAuth, requireRole('admin'), AIController.getAntiSpamStats);
router.get('/stats/rate-limit', requireAuth, requireRole('admin'), AIController.getRateLimitStats);

export default router;