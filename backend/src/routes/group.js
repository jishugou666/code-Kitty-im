import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { GroupController } from '../controllers/GroupController.js';

const router = Router();

router.use(authMiddleware);

router.post('/', GroupController.create);
router.get('/', GroupController.getList);
router.get('/search', GroupController.search);
router.get('/:groupId', GroupController.getInfo);
router.post('/:groupId/join', GroupController.join);
router.post('/:groupId/leave', GroupController.leave);
router.put('/:groupId/admin/:userId', GroupController.setAdmin);
router.delete('/:groupId/members/:userId', GroupController.removeMember);
router.get('/:groupId/requests', GroupController.getJoinRequests);
router.put('/:groupId/requests/:requestId', GroupController.handleJoinRequest);
router.put('/:groupId', GroupController.update);
router.delete('/:groupId', GroupController.delete);

export default router;