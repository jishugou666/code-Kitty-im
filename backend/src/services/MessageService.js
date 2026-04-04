import { query } from '../utils/db.js';

export const MessageService = {
  async getMessageList(conversationId, limit = 50) {
    try {
      const sql = `
        SELECT m.id, m.conversation_id, m.sender_id, m.content, m.type, m.created_at, m.is_read,
               COALESCE(u.nickname, 'Unknown') AS sender_nickname,
               COALESCE(u.avatar, '') AS sender_avatar
        FROM message m
        LEFT JOIN user u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at ASC
        LIMIT ?
      `;
      const rows = await query(sql, [conversationId, parseInt(limit)]);

      if (!Array.isArray(rows)) {
        console.error('getMessageList: query result is not an array', typeof rows);
        return { code: 200, data: [] };
      }

      return { code: 200, data: rows };
    } catch (err) {
      console.error('获取消息失败:', err);
      return { code: 200, data: [] };
    }
  },

  async sendMessage(conversationId, senderId, content, type = 'text') {
    try {
      const result = await query(
        'INSERT INTO message (conversation_id, sender_id, content, type) VALUES (?, ?, ?, ?)',
        [conversationId, senderId, content, type]
      );

      const messages = await query(
        `SELECT m.id, m.conversation_id, m.sender_id, m.content, m.type, m.created_at, m.is_read,
                COALESCE(u.nickname, 'Unknown') AS sender_nickname,
                COALESCE(u.avatar, '') AS sender_avatar
         FROM message m
         LEFT JOIN user u ON m.sender_id = u.id
         WHERE m.id = ?`,
        [result.insertId]
      );

      await query('UPDATE conversation SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [conversationId]);

      const message = Array.isArray(messages) && messages.length > 0 ? messages[0] : null;
      return { code: 200, data: message };
    } catch (err) {
      console.error('发送消息失败:', err);
      throw err;
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
      return { code: 200, data: null };
    } catch (err) {
      console.error('标记已读失败:', err);
      return { code: 200, data: null };
    }
  },

  async searchMessages(userId, keyword, limit = 50) {
    try {
      const messages = await query(
        `SELECT m.id, m.conversation_id, m.sender_id, m.content, m.type, m.created_at,
                COALESCE(u.nickname, 'Unknown') AS sender_nickname,
                COALESCE(u.avatar, '') AS sender_avatar,
                c.type AS conversation_type, c.name AS conversation_name
         FROM message m
         LEFT JOIN user u ON m.sender_id = u.id
         LEFT JOIN conversation c ON m.conversation_id = c.id
         WHERE m.content LIKE ? AND m.type = 'text'
         ORDER BY m.created_at DESC
         LIMIT ?`,
        [`%${keyword}%`, parseInt(limit)]
      );

      if (!Array.isArray(messages)) {
        return { code: 200, data: [] };
      }

      return { code: 200, data: messages };
    } catch (err) {
      console.error('搜索消息失败:', err);
      return { code: 200, data: [] };
    }
  }
};
