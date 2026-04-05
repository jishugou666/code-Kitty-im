import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/profile', authMiddleware, UserController.getProfile);
router.put('/profile', authMiddleware, UserController.updateProfile);
router.get('/search', authMiddleware, UserController.searchUsers);
router.post('/logout', authMiddleware, UserController.logout);
router.put('/status', authMiddleware, UserController.updateStatus);

export default router;
