import { Router } from 'express';
import { MessageController } from '../controllers/MessageController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/send', MessageController.sendMessage);
router.get('/list', MessageController.getMessageList);
router.get('/search', MessageController.searchMessages);
router.post('/read', MessageController.markAsRead);

export default router;
