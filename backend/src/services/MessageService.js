import { query } from '../utils/db.js';
import { triggerEvent } from '../utils/pusher.js';

export const MessageService = {
  async getMessageList(conversationId, limit = 50) {
    console.log('=== [Service] getMessageList 开始 ===');
    console.log('conversationId:', conversationId, 'limit:', limit);
    try {
      const safeLimit = parseInt(limit) || 50;
      
      console.log('1. 先查询该会话的所有消息（无 JOIN）...');
      const simpleRows = await query(
        'SELECT * FROM message WHERE conversation_id = ?',
        [conversationId]
      );
      console.log('简单查询结果（无 JOIN）:', simpleRows);
      console.log('简单查询结果数量:', simpleRows?.length || 0);
      
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
      console.log('2. 执行带 JOIN 的 SQL...');
      console.log('SQL:', sql);
      console.log('Params:', [conversationId]);
      
      const rows = await query(sql, [conversationId]);
      console.log('带 JOIN 的查询结果:', rows);
      console.log('带 JOIN 的查询结果数量:', rows?.length || 0);

      if (!Array.isArray(rows)) {
        console.error('查询结果不是数组:', rows);
        return { code: 200, data: [], msg: '成功' };
      }

      console.log('=== [Service] getMessageList 完成，返回', rows.length, '条消息 ===');
      return { code: 200, data: rows, msg: '成功' };
    } catch (err) {
      console.error('=== [Service] getMessageList 错误 ===', err);
      console.error('错误堆栈:', err.stack);
      return { code: 200, data: [], msg: '成功' };
    }
  },

  async sendMessage(conversationId, senderId, content, type = 'text') {
    console.log('sendMessage called with:', { conversationId, senderId, content, type });
    try {
      if (!conversationId || !senderId || !content) {
        return { code: 400, data: null, msg: '缺少必要参数' };
      }

      const result = await query(
        'INSERT INTO message (conversation_id, sender_id, content, type) VALUES (?, ?, ?, ?)',
        [conversationId, senderId, content, type || 'text']
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
    console.log('markAsRead called with:', { conversationId, userId });
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
    console.log('searchMessages called with:', { userId, keyword, limit });
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
  }
};
