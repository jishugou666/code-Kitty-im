import { query } from '../utils/db.js';

export const TempConversationService = {
  async isTempConversation(conversationId, userId) {
    try {
      const conv = await query(
        `SELECT c.*, cm.role FROM conversation c
         JOIN conversation_member cm ON c.id = cm.conversation_id AND cm.user_id = ?
         WHERE c.id = ?`,
        [userId, conversationId]
      );

      if (conv.length === 0) {
        return { code: 200, data: { isTemp: false }, msg: '成功' };
      }

      const conversation = conv[0];

      if (conversation.type !== 'single') {
        return { code: 200, data: { isTemp: false }, msg: '成功' };
      }

      const members = await query(
        'SELECT user_id FROM conversation_member WHERE conversation_id = ?',
        [conversationId]
      );

      if (members.length !== 2) {
        return { code: 200, data: { isTemp: false }, msg: '成功' };
      }

      const otherUserId = members.find(m => m.user_id !== userId)?.user_id;

      const friendship = await query(
        `SELECT id FROM contact
         WHERE user_id = ? AND contact_user_id = ? AND status = 'accepted' AND is_friend = 1`,
        [userId, otherUserId]
      );

      const reverseFriendship = await query(
        `SELECT id FROM contact
         WHERE user_id = ? AND contact_user_id = ? AND status = 'accepted' AND is_friend = 1`,
        [otherUserId, userId]
      );

      const isTemp = friendship.length === 0 || reverseFriendship.length === 0;

      return {
        code: 200,
        data: {
          isTemp,
          otherUserId,
          conversationId
        },
        msg: '成功'
      };
    } catch (err) {
      console.error('isTempConversation error:', err);
      return { code: 200, data: { isTemp: false }, msg: '检查失败' };
    }
  },

  async recordTempConversation(conversationId, userId, targetUserId) {
    try {
      await query(
        `INSERT INTO temp_conversation (conversation_id, user_id, target_user_id)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP`,
        [conversationId, userId, targetUserId]
      );
      return { code: 200, data: null, msg: '成功' };
    } catch (err) {
      console.error('recordTempConversation error:', err);
      return { code: 200, data: null, msg: '记录失败' };
    }
  },

  async getTempConversations(userId) {
    try {
      const conversations = await query(
        `SELECT tc.*, c.type as conversation_type, u.nickname, u.username, u.avatar
         FROM temp_conversation tc
         JOIN conversation c ON tc.conversation_id = c.id
         LEFT JOIN user u ON tc.target_user_id = u.id
         WHERE tc.user_id = ? AND tc.is_blocked = 0
         ORDER BY tc.created_at DESC`,
        [userId]
      );
      return { code: 200, data: conversations, msg: '成功' };
    } catch (err) {
      console.error('getTempConversations error:', err);
      return { code: 200, data: [], msg: '获取失败' };
    }
  },

  async blockTempConversation(conversationId, userId) {
    try {
      await query(
        'UPDATE temp_conversation SET is_blocked = 1 WHERE conversation_id = ? AND user_id = ?',
        [conversationId, userId]
      );
      return { code: 200, data: null, msg: '拉黑成功' };
    } catch (err) {
      console.error('blockTempConversation error:', err);
      return { code: 200, data: null, msg: '拉黑失败' };
    }
  }
};