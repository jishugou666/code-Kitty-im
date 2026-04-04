import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { MomentsController } from '../controllers/MomentsController.js';

const router = Router();

router.post('/', authMiddleware, MomentsController.create);
router.get('/list', authMiddleware, MomentsController.getList);
router.delete('/:id', authMiddleware, MomentsController.delete);
router.post('/:id/like', authMiddleware, MomentsController.like);
router.get('/:id/comments', authMiddleware, MomentsController.getComments);
router.post('/:id/comments', authMiddleware, MomentsController.addComment);
router.delete('/comments/:commentId', authMiddleware, MomentsController.deleteComment);
router.get('/user/:userId', authMiddleware, MomentsController.getUserMoments);

export default router;