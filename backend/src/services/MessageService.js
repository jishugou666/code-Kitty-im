import { query } from '../utils/db.js';

export const MessageService = {
  async sendMessage(conversationId, senderId, content, type = 'text') {
    try {
      const result = await query(
        'INSERT INTO message (conversation_id, sender_id, content, type) VALUES (?, ?, ?, ?)',
        [conversationId, senderId, content, type]
      );

      const messages = await query(
        `SELECT m.id, m.conversation_id, m.sender_id, m.content, m.type, m.created_at,
                COALESCE(u.nickname, 'Unknown') as sender_nickname,
                COALESCE(u.avatar, '') as sender_avatar
         FROM message m
         LEFT JOIN user u ON m.sender_id = u.id
         WHERE m.id = ?`,
        [result.insertId]
      );

      await query('UPDATE conversation SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [conversationId]);

      return messages[0] || null;
    } catch (err) {
      console.error('sendMessage error:', err);
      throw err;
    }
  },

  async getMessageList(conversationId, userId, limit = 50, beforeId = null) {
    try {
      let sql = `
        SELECT m.id, m.conversation_id, m.sender_id, m.content, m.type, m.created_at, m.is_read,
               COALESCE(u.nickname, 'Unknown') as sender_nickname,
               COALESCE(u.avatar, '') as sender_avatar
        FROM message m
        LEFT JOIN user u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
      `;
      const params = [conversationId];

      if (beforeId) {
        sql += ' AND m.id < ?';
        params.push(beforeId);
      }

      sql += ' ORDER BY m.created_at DESC LIMIT ?';
      params.push(parseInt(limit));

      const messages = await query(sql, params);
      return messages.reverse();
    } catch (err) {
      console.error('getMessageList error:', err);
      throw err;
    }
  },

  async getUnreadCount(conversationId, userId) {
    try {
      const result = await query(
        `SELECT COUNT(*) as count FROM message
         WHERE conversation_id = ? AND sender_id != ?`,
        [conversationId, userId]
      );
      return result[0]?.count || 0;
    } catch (err) {
      console.error('getUnreadCount error:', err);
      return 0;
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
      console.error('markAsRead error:', err);
    }
  },

  async searchMessages(userId, keyword, limit = 50) {
    try {
      const messages = await query(
        `SELECT m.id, m.conversation_id, m.sender_id, m.content, m.type, m.created_at,
                COALESCE(u.nickname, 'Unknown') as sender_nickname,
                COALESCE(u.avatar, '') as sender_avatar,
                c.type as conversation_type, c.name as conversation_name
         FROM message m
         LEFT JOIN user u ON m.sender_id = u.id
         LEFT JOIN conversation c ON m.conversation_id = c.id
         LEFT JOIN conversation_member cm ON c.id = cm.conversation_id AND cm.user_id = ?
         WHERE m.content LIKE ? AND m.type = 'text'
         ORDER BY m.created_at DESC
         LIMIT ?`,
        [userId, `%${keyword}%`, parseInt(limit)]
      );
      return messages;
    } catch (err) {
      console.error('searchMessages error:', err);
      throw err;
    }
  }
};
