import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { SettingsController } from '../controllers/SettingsController.js';

const router = Router();

router.get('/', authMiddleware, SettingsController.getSettings);
router.put('/', authMiddleware, SettingsController.updateSettings);
router.put('/profile', authMiddleware, SettingsController.updateProfile);
router.put('/password', authMiddleware, SettingsController.changePassword);

export default router;