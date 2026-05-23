import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { SystemNotificationController } from '../controllers/SystemNotificationController.js';

const router = Router();

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'tech_god') {
    return res.status(403).json({ code: 403, data: null, msg: '无权限访问' });
  }
  next();
};

router.get('/list', authMiddleware, SystemNotificationController.getAllNotifications);
router.get('/admin/list', authMiddleware, adminMiddleware, SystemNotificationController.getAllAdminNotifications);
router.post('/', authMiddleware, adminMiddleware, SystemNotificationController.createNotification);
router.put('/:id', authMiddleware, adminMiddleware, SystemNotificationController.updateNotification);
router.delete('/:id', authMiddleware, adminMiddleware, SystemNotificationController.deleteNotification);

export default router;
