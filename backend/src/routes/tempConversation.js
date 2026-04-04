import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { TempConversationController } from '../controllers/TempConversationController.js';

const router = Router();

router.get('/:conversationId/check', authMiddleware, TempConversationController.check);
router.post('/record', authMiddleware, TempConversationController.record);
router.put('/:conversationId/block', authMiddleware, TempConversationController.block);

export default router;