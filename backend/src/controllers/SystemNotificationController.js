import { query } from '../utils/db.js';

export const SystemNotificationController = {
  async getAllNotifications(req, res, next) {
    try {
      const results = await query(
        'SELECT id, title, content, type, icon, image_url, is_active, created_by, created_at, updated_at FROM system_notification WHERE is_active = 1 ORDER BY created_at DESC'
      );
      res.json({ code: 200, data: results, msg: '成功' });
    } catch (err) {
      console.error('getAllNotifications error:', err);
      res.json({ code: 200, data: [], msg: '获取失败' });
    }
  },

  async getAllAdminNotifications(req, res, next) {
    try {
      const results = await query(
        'SELECT id, title, content, type, icon, image_url, is_active, created_by, created_at, updated_at FROM system_notification ORDER BY created_at DESC'
      );
      res.json({ code: 200, data: results, msg: '成功' });
    } catch (err) {
      console.error('getAllAdminNotifications error:', err);
      res.json({ code: 200, data: [], msg: '获取失败' });
    }
  },

  async createNotification(req, res, next) {
    try {
      const { title, content, type, icon, image_url } = req.body;
      if (!title || !content) {
        return res.json({ code: 400, data: null, msg: '标题和内容不能为空' });
      }
      const validTypes = ['info', 'warning', 'success', 'announcement'];
      const notificationType = validTypes.includes(type) ? type : 'info';
      const result = await query(
        'INSERT INTO system_notification (title, content, type, icon, image_url, created_by) VALUES (?, ?, ?, ?, ?, ?)',
        [title, content, notificationType, icon || null, image_url || null, req.user?.id || null]
      );
      res.json({ code: 200, data: { insertId: result.insertId }, msg: '创建成功' });
    } catch (err) {
      console.error('createNotification error:', err);
      res.json({ code: 200, data: null, msg: '创建失败' });
    }
  },

  async updateNotification(req, res, next) {
    try {
      const { id } = req.params;
      const { title, content, type, icon, image_url, is_active } = req.body;
      const existing = await query('SELECT id FROM system_notification WHERE id = ?', [parseInt(id)]);
      if (existing.length === 0) {
        return res.json({ code: 404, data: null, msg: '通知不存在' });
      }
      const validTypes = ['info', 'warning', 'success', 'announcement'];
      const notificationType = validTypes.includes(type) ? type : undefined;
      const fields = [];
      const values = [];
      if (title !== undefined) { fields.push('title = ?'); values.push(title); }
      if (content !== undefined) { fields.push('content = ?'); values.push(content); }
      if (notificationType !== undefined) { fields.push('type = ?'); values.push(notificationType); }
      if (icon !== undefined) { fields.push('icon = ?'); values.push(icon); }
      if (image_url !== undefined) { fields.push('image_url = ?'); values.push(image_url); }
      if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }
      if (fields.length === 0) {
        return res.json({ code: 400, data: null, msg: '没有要更新的字段' });
      }
      values.push(parseInt(id));
      await query(`UPDATE system_notification SET ${fields.join(', ')} WHERE id = ?`, values);
      res.json({ code: 200, data: null, msg: '更新成功' });
    } catch (err) {
      console.error('updateNotification error:', err);
      res.json({ code: 200, data: null, msg: '更新失败' });
    }
  },

  async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await query('SELECT id FROM system_notification WHERE id = ?', [parseInt(id)]);
      if (existing.length === 0) {
        return res.json({ code: 404, data: null, msg: '通知不存在' });
      }
      await query('DELETE FROM system_notification WHERE id = ?', [parseInt(id)]);
      res.json({ code: 200, data: null, msg: '删除成功' });
    } catch (err) {
      console.error('deleteNotification error:', err);
      res.json({ code: 200, data: null, msg: '删除失败' });
    }
  }
};
