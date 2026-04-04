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
      return { code: 200, data: rows };
    } catch (err) {
      console.error('获取消息失败:', err);
      return { code: 500, data: null, msg: '获取消息失败' };
    }
  },

  async sendMessage(conversationId, senderId, content, type = 'text') {
    try {
      const result = await query(
        'INSERT INTO message (conversation_id, sender_id, content, type) VALUES (?, ?, ?, ?)',
        [conversationId, senderId, content, type]
      );

      const messages = await query(
        `SELECT m.id, m.conversation_id, m.sender_id, m.content, m.type, m.created_at,
                COALESCE(u.nickname, 'Unknown') AS sender_nickname,
                COALESCE(u.avatar, '') AS sender_avatar
         FROM message m
         LEFT JOIN user u ON m.sender_id = u.id
         WHERE m.id = ?`,
        [result.insertId]
      );

      await query('UPDATE conversation SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [conversationId]);

      return messages[0] || null;
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
    } catch (err) {
      console.error('标记已读失败:', err);
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
      return messages;
    } catch (err) {
      console.error('搜索消息失败:', err);
      throw err;
    }
  }
};
