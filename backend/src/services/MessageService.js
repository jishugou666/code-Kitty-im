import { query } from '../utils/db.js';
import { triggerEvent } from '../utils/pusher.js';

export const MessageService = {
  async getMessageList(conversationId, limit = 50) {
    try {
      const safeLimit = parseInt(limit) || 50;

      const sql = `
        SELECT
          m.id,
          m.conversation_id,
          m.sender_id,
          m.content,
          m.type,
          m.created_at,
          COALESCE(u.nickname, 'Unknown') AS sender_nickname,
          COALESCE(u.avatar, '') AS sender_avatar
        FROM message m
        LEFT JOIN user u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at ASC
        LIMIT ${safeLimit}
      `;

      const rows = await query(sql, [conversationId]);

      if (!Array.isArray(rows)) {
        return { code: 200, data: [], msg: '成功' };
      }

      return { code: 200, data: rows, msg: '成功' };
    } catch (err) {
      console.error('getMessageList error:', err);
      return { code: 200, data: [], msg: '成功' };
    }
  },

  async sendMessage(conversationId, senderId, content, type = 'text') {
    try {
      if (!conversationId || !senderId) {
        return { code: 400, data: null, msg: '缺少必要参数' };
      }

      if (!content && type !== 'image') {
        return { code: 400, data: null, msg: '消息内容不能为空' };
      }

      const result = await query(
        'INSERT INTO message (conversation_id, sender_id, content, type) VALUES (?, ?, ?, ?)',
        [conversationId, senderId, content || '', type || 'text']
      );

      if (!result || !result.insertId) {
        return { code: 200, data: null, msg: '发送失败' };
      }

      const messages = await query(
        `SELECT
          m.id,
          m.conversation_id,
          m.sender_id,
          m.content,
          m.type,
          m.created_at,
          COALESCE(u.nickname, 'Unknown') AS sender_nickname,
          COALESCE(u.avatar, '') AS sender_avatar
         FROM message m
         LEFT JOIN user u ON m.sender_id = u.id
         WHERE m.id = ?`,
        [result.insertId]
      );

      await query('UPDATE conversation SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [conversationId]);

      if (!Array.isArray(messages) || messages.length === 0) {
        return { code: 200, data: null, msg: '发送成功' };
      }

      triggerEvent(`chat-${conversationId}`, 'new-message', messages[0]);

      return { code: 200, data: messages[0], msg: '发送成功' };
    } catch (err) {
      console.error('sendMessage error:', err);
      return { code: 200, data: null, msg: '发送失败' };
    }
  },

  async markAsRead(conversationId, userId) {
    try {
      await query(
        `INSERT INTO message_read (conversation_id, user_id, seen_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE seen_at = CURRENT_TIMESTAMP`,
        [conversationId, userId]
      );

      triggerEvent(`chat-${conversationId}`, 'message-read', { conversationId, userId });

      return { code: 200, data: null, msg: '成功' };
    } catch (err) {
      console.error('markAsRead error:', err);
      return { code: 200, data: null, msg: '标记已读失败' };
    }
  },

  async searchMessages(userId, keyword, limit = 50) {
    try {
      const safeLimit = parseInt(limit) || 50;
      const messages = await query(
        `SELECT
          m.id,
          m.conversation_id,
          m.sender_id,
          m.content,
          m.type,
          m.created_at,
          COALESCE(u.nickname, 'Unknown') AS sender_nickname,
          COALESCE(u.avatar, '') AS sender_avatar,
          c.type AS conversation_type,
          c.name AS conversation_name
         FROM message m
         LEFT JOIN user u ON m.sender_id = u.id
         LEFT JOIN conversation c ON m.conversation_id = c.id
         WHERE m.content LIKE ? AND m.type = 'text'
         ORDER BY m.created_at DESC
         LIMIT ${safeLimit}`,
        [`%${keyword}%`]
      );

      if (!Array.isArray(messages)) {
        return { code: 200, data: [], msg: '成功' };
      }

      return { code: 200, data: messages, msg: '成功' };
    } catch (err) {
      console.error('searchMessages error:', err);
      return { code: 200, data: [], msg: '搜索失败' };
    }
  },

  async recallMessage(messageId, userId) {
    try {
      const messages = await query(
        'SELECT * FROM message WHERE id = ? AND sender_id = ?',
        [messageId, userId]
      );

      if (!messages || messages.length === 0) {
        return { code: 400, data: null, msg: '消息不存在或无权撤回' };
      }

      const message = messages[0];
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (new Date(message.created_at) < fiveMinutesAgo) {
        return { code: 400, data: null, msg: '超过5分钟，无法撤回' };
      }

      await query(
        "UPDATE message SET type = 'recalled', content = '此消息已撤回' WHERE id = ?",
        [messageId]
      );

      triggerEvent(`chat-${message.conversation_id}`, 'message-recalled', { messageId, conversationId: message.conversation_id });

      return { code: 200, data: { messageId, conversationId: message.conversation_id }, msg: '已撤回' };
    } catch (err) {
      console.error('recallMessage error:', err);
      return { code: 200, data: null, msg: '撤回失败' };
    }
  }
};
