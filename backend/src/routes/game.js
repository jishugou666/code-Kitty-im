import { Router } from 'express';
import { GameController } from '../controllers/GameController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/', authMiddleware, GameController.createMatch);
router.post('/invite', authMiddleware, GameController.invite);
router.post('/invite/respond', authMiddleware, GameController.respondInvite);
router.post('/:matchId/move', authMiddleware, GameController.move);
router.post('/:matchId/surrender', authMiddleware, GameController.surrender);
router.post('/:matchId/finish', authMiddleware, GameController.finish);
router.post('/:matchId/heartbeat', authMiddleware, GameController.heartbeat);
router.get('/profile', authMiddleware, GameController.getProfile);
router.get('/leaderboard', authMiddleware, GameController.getLeaderboard);
router.get('/history', authMiddleware, GameController.getHistory);
router.get('/random-opponent', authMiddleware, GameController.getRandomOpponent);
router.get('/monitor/abandoned', authMiddleware, GameController.checkAbandonedMatches);
router.get('/:matchId', authMiddleware, GameController.getMatchById);

export default router;
