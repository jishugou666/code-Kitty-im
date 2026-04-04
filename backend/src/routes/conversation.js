import { Router } from 'express';
import { ConversationController } from '../controllers/ConversationController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/single', ConversationController.createSingle);
router.post('/group', ConversationController.createGroup);
router.get('/list', ConversationController.getList);
router.get('/:id', ConversationController.getConversation);
router.get('/:id/members', ConversationController.getMembers);
router.post('/:id/members', ConversationController.addMembers);
router.delete('/:id/members/:userId', ConversationController.removeMember);

export default router;
