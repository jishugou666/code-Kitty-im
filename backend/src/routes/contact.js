import { Router } from 'express';
import { ContactController } from '../controllers/ContactController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/list', ContactController.getContactList);
router.get('/requests', ContactController.getPendingRequests);
router.post('/add', ContactController.addContact);
router.post('/accept', ContactController.acceptContact);
router.post('/reject', ContactController.rejectContact);
router.post('/block', ContactController.blockContact);
router.post('/unblock', ContactController.unblockContact);
router.delete('/:userId', ContactController.deleteContact);

export default router;
