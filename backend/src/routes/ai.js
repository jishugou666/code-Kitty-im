import { Router } from 'express';
import { AIController } from '../controllers/AIController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/stats', requireAuth, requireRole('admin'), AIController.getStats);
router.get('/stats/cache', requireAuth, requireRole('admin'), AIController.getCacheStats);
router.get('/stats/anti-spam', requireAuth, requireRole('admin'), AIController.getAntiSpamStats);
router.get('/stats/rate-limit', requireAuth, requireRole('admin'), AIController.getRateLimitStats);
router.get('/service-status', requireAuth, requireRole('admin'), AIController.getServiceStatus);
router.get('/service-stats', requireAuth, requireRole('admin'), AIController.getAIServiceStats);

router.get('/feedback', requireAuth, requireRole('admin'), AIController.getFeedbackList);
router.get('/feedback/:id', requireAuth, requireRole('admin'), AIController.getFeedbackDetail);
router.post('/feedback/:id/handle', requireAuth, requireRole('admin'), AIController.handleFeedback);

router.get('/activity-log', requireAuth, requireRole('admin'), AIController.getActivityLog);

router.get('/blacklist', requireAuth, requireRole('admin'), AIController.getBlacklist);
router.post('/blacklist', requireAuth, requireRole('admin'), AIController.addToBlacklist);
router.delete('/blacklist/:id', requireAuth, requireRole('admin'), AIController.removeFromBlacklist);

export default router;