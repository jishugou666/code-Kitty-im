import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { AdminController } from '../controllers/AdminController.js';

const router = Router();

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'tech_god') {
    return res.status(403).json({ code: 403, data: null, msg: '无权限访问' });
  }
  next();
};

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/dashboard', AdminController.getDashboard);
router.get('/users', AdminController.getUsers);
router.put('/users/status', AdminController.updateUserStatus);
router.put('/users/role', AdminController.updateUserRole);
router.delete('/users/:userId', AdminController.deleteUser);
router.get('/conversations', AdminController.getConversations);
router.get('/conversations/:conversationId/messages', AdminController.getMessages);
router.get('/moments', AdminController.getMoments);
router.delete('/moments/:momentId', AdminController.deleteMoment);
router.get('/tables', AdminController.getTables);
router.get('/tables/:tableName', AdminController.getTableData);
router.post('/query', AdminController.executeQuery);

export default router;