import { Router } from 'express';
import { GameController } from '../controllers/GameController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/', authMiddleware, GameController.createMatch);
router.post('/:matchId/move', authMiddleware, GameController.move);
router.post('/:matchId/surrender', authMiddleware, GameController.surrender);
router.post('/:matchId/finish', authMiddleware, GameController.finish);
router.get('/profile', authMiddleware, GameController.getProfile);
router.get('/leaderboard', authMiddleware, GameController.getLeaderboard);
router.get('/history', authMiddleware, GameController.getHistory);

export default router;
