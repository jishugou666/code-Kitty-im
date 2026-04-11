import { AIServiceManager } from '../services/AIServiceManager.js';
import { antiSpamService } from '../services/antiSpamService.js';
import { query } from '../utils/db.js';
import { success } from '../utils/response.js';

export const AIController = {
  async getStats(req, res, next) {
    try {
      const stats = AIServiceManager.getAllStats();
      res.json(success(stats, 'AI服务统计获取成功'));
    } catch (err) {
      console.error('获取AI服务统计失败:', err);
      next(err);
    }
  },

  async getCacheStats(req, res, next) {
    try {
      const stats = AIServiceManager.getCacheStats();
      res.json(success(stats, '缓存统计获取成功'));
    } catch (err) {
      console.error('获取缓存统计失败:', err);
      next(err);
    }
  },

  async getAntiSpamStats(req, res, next) {
    try {
      const stats = AIServiceManager.getAntiSpamStats();
      res.json(success(stats, '反垃圾统计获取成功'));
    } catch (err) {
      console.error('获取反垃圾统计失败:', err);
      next(err);
    }
  },

  async getRateLimitStats(req, res, next) {
    try {
      const stats = AIServiceManager.getRateLimiterStats();
      res.json(success(stats, '限流统计获取成功'));
    } catch (err) {
      console.error('获取限流统计失败:', err);
      next(err);
    }
  },

  async getServiceStatus(req, res, next) {
    try {
      const rows = await query(`SELECT * FROM ai_service_status ORDER BY service_name`);
      res.json(success(rows, 'AI服务状态获取成功'));
    } catch (err) {
      console.error('获取AI服务状态失败:', err);
      next(err);
    }
  },

  async getAIServiceStats(req, res, next) {
    try {
      const serviceStats = antiSpamService.getServiceStats();
      res.json(success(serviceStats, 'AntiSpam服务统计获取成功'));
    } catch (err) {
      console.error('获取AntiSpam服务统计失败:', err);
      next(err);
    }
  },

  async getFeedbackList(req, res, next) {
    try {
      const { status, type, severity, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = '1=1';
      const params = [];

      if (status) {
        whereClause += ' AND f.status = ?';
        params.push(status);
      }
      if (type) {
        whereClause += ' AND f.type = ?';
        params.push(type);
      }
      if (severity) {
        whereClause += ' AND f.severity = ?';
        params.push(severity);
      }

      console.log('[AIController] getFeedbackList params:', { whereClause, params, limit: parseInt(limit), offset: parseInt(offset) });

      const rows = await query(
        `SELECT f.*, u.username, u.nickname, u.avatar
         FROM ai_feedback f
         LEFT JOIN users u ON f.user_id = u.id
         WHERE ${whereClause}
         ORDER BY f.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), parseInt(offset)]
      );

      console.log('[AIController] getFeedbackList rows:', rows?.length);

      const countResult = await query(
        `SELECT COUNT(*) as total FROM ai_feedback f WHERE ${whereClause}`,
        params
      );

      res.json(success({
        list: rows || [],
        total: countResult?.[0]?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit)
      }, 'AI反馈列表获取成功'));
    } catch (err) {
      console.error('获取AI反馈列表失败:', err);
      res.status(500).json({ success: false, message: '获取AI反馈列表失败', error: err.message });
    }
  },

  async getFeedbackDetail(req, res, next) {
    try {
      const { id } = req.params;

      const rows = await query(
        `SELECT f.*, u.username, u.nickname, u.avatar, u.email
         FROM ai_feedback f
         LEFT JOIN users u ON f.user_id = u.id
         WHERE f.id = ?`,
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: '反馈记录不存在' });
      }

      res.json(success(rows[0], 'AI反馈详情获取成功'));
    } catch (err) {
      console.error('获取AI反馈详情失败:', err);
      next(err);
    }
  },

  async handleFeedback(req, res, next) {
    try {
      const { id } = req.params;
      const { action, handleResult } = req.body;
      const adminId = req.user.id;

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ success: false, message: '无效的操作类型' });
      }

      const rows = await query(
        `SELECT * FROM ai_feedback WHERE id = ? AND status = 'pending'`,
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: '反馈记录不存在或已处理' });
      }

      const feedback = rows[0];
      const newStatus = action === 'approve' ? 'approved' : 'rejected';

      await query(
        `UPDATE ai_feedback SET status = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP, handle_result = ?
         WHERE id = ?`,
        [newStatus, adminId, handleResult || '', id]
      );

      if (action === 'approve' && feedback.target_type === 'message' && feedback.target_id) {
        try {
          await query(`DELETE FROM messages WHERE id = ?`, [feedback.target_id]);
        } catch (e) {
          console.error('[AIFeedback] Failed to delete message:', e);
        }
      }

      await query(
        `INSERT INTO ai_activity_log (service_name, action, target_type, target_id, result, details, user_id)
         VALUES ('antiSpam', ?, 'feedback', ?, 'success', ?, ?)`,
        [action, id, JSON.stringify({ handleResult }), adminId]
      );

      res.json(success({ id, status: newStatus }, action === 'approve' ? '已通过，内容已删除' : '已驳回'));
    } catch (err) {
      console.error('处理AI反馈失败:', err);
      next(err);
    }
  },

  async getActivityLog(req, res, next) {
    try {
      const { service, action, page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = '1=1';
      const params = [];

      if (service) {
        whereClause += ' AND service_name = ?';
        params.push(service);
      }
      if (action) {
        whereClause += ' AND action = ?';
        params.push(action);
      }

      const rows = await query(
        `SELECT * FROM ai_activity_log
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), parseInt(offset)]
      );

      const countResult = await query(
        `SELECT COUNT(*) as total FROM ai_activity_log WHERE ${whereClause}`,
        params
      );

      res.json(success({
        list: rows,
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      }, '活动日志获取成功'));
    } catch (err) {
      console.error('获取活动日志失败:', err);
      next(err);
    }
  },

  async getBlacklist(req, res, next) {
    try {
      const { type, status, page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = "status = 'active'";
      const params = [];

      if (type) {
        whereClause += ' AND type = ?';
        params.push(type);
      }
      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      const rows = await query(
        `SELECT * FROM ai_blacklist
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), parseInt(offset)]
      );

      res.json(success(rows, '黑名单获取成功'));
    } catch (err) {
      console.error('获取黑名单失败:', err);
      next(err);
    }
  },

  async addToBlacklist(req, res, next) {
    try {
      const { type, value, reason, severity, expiresAt } = req.body;
      const adminId = req.user.id;

      if (!type || !value) {
        return res.status(400).json({ success: false, message: '类型和值不能为空' });
      }

      const result = await query(
        `INSERT INTO ai_blacklist (type, value, reason, source, severity, expires_at, created_by)
         VALUES (?, ?, ?, 'admin_added', ?, ?, ?)`,
        [type, value, reason || '', severity || 'warning', expiresAt || null, adminId]
      );

      res.json(success({ id: result.insertId }, '已添加到黑名单'));
    } catch (err) {
      console.error('添加黑名单失败:', err);
      next(err);
    }
  },

  async removeFromBlacklist(req, res, next) {
    try {
      const { id } = req.params;

      await query(
        `UPDATE ai_blacklist SET status = 'inactive' WHERE id = ?`,
        [id]
      );

      res.json(success(null, '已从黑名单移除'));
    } catch (err) {
      console.error('移除黑名单失败:', err);
      next(err);
    }
  }
};

export default AIController;