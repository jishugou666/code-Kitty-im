import { query } from '../utils/db.js';

export const MessageService = {
  async sendMessage(conversationId, senderId, content, type = 'text') {
    const result = await query(
      'INSERT INTO message (conversation_id, sender_id, content, type) VALUES (?, ?, ?, ?)',
      [conversationId, senderId, content, type]
    );

    const messages = await query(
      `SELECT m.*, u.username, u.nickname, u.avatar
       FROM message m
       JOIN user u ON m.sender_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    await query('UPDATE conversation SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [conversationId]);

    return messages[0];
  },

  async getMessageList(conversationId, userId, limit = 50, beforeId = null) {
    let sql = `
      SELECT m.*, u.username, u.nickname, u.avatar
      FROM message m
      JOIN user u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
    `;
    const params = [conversationId];

    if (beforeId) {
      sql += ' AND m.id < ?';
      params.push(beforeId);
    }

    sql += ' ORDER BY m.created_at DESC LIMIT ?';
    params.push(limit);

    const messages = await query(sql, params);
    return messages.reverse();
  },

  async getUnreadCount(conversationId, userId) {
    const result = await query(
      `SELECT COUNT(*) as count FROM message
       WHERE conversation_id = ? AND sender_id != ?`,
      [conversationId, userId]
    );
    return result[0].count;
  },

  async markAsRead(conversationId, userId) {
    await query(
      `INSERT INTO message_read (conversation_id, user_id, seen_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE seen_at = CURRENT_TIMESTAMP`,
      [conversationId, userId]
    );
  },

  async searchMessages(userId, keyword, limit = 50) {
    const messages = await query(
      `SELECT m.*, u.username, u.nickname, u.avatar, c.type as conversation_type, c.name as conversation_name
       FROM message m
       JOIN user u ON m.sender_id = u.id
       JOIN conversation c ON m.conversation_id = c.id
       JOIN conversation_member cm ON c.id = cm.conversation_id AND cm.user_id = ?
       WHERE m.content LIKE ? AND m.type = 'text'
       ORDER BY m.created_at DESC
       LIMIT ?`,
      [userId, `%${keyword}%`, limit]
    );
    return messages;
  }
};
