import { query } from '../utils/db.js';

const WorldChannelService = {
  async getOrCreateWorldChannel() {
    try {
      let [world] = await query("SELECT * FROM conversation WHERE type = 'world' LIMIT 1");
      if (!world) {
        const result = await query(
          "INSERT INTO conversation (type, name, created_at) VALUES ('world', '世界频道', NOW())"
        );
        [world] = await query("SELECT * FROM conversation WHERE type = 'world' LIMIT 1");
      }
      return world;
    } catch (err) {
      console.error('[WorldChannelService] getOrCreateWorldChannel error:', err);
      throw err;
    }
  },

  async ensureMember(conversationId, userId) {
    try {
      const [member] = await query(
        "SELECT * FROM conversation_member WHERE conversation_id = ? AND user_id = ?",
        [conversationId, userId]
      );
      if (!member) {
        await query(
          "INSERT INTO conversation_member (conversation_id, user_id, joined_at) VALUES (?, ?, NOW())",
          [conversationId, userId]
        );
      }
      return true;
    } catch (err) {
      console.error('[WorldChannelService] ensureMember error:', err);
      throw err;
    }
  },

  async getMessages(conversationId, limit = 50) {
    try {
      const messages = await query(
        `SELECT m.*, u.nickname as sender_nickname, u.avatar as sender_avatar
         FROM message m
         LEFT JOIN user u ON m.sender_id = u.id
         WHERE m.conversation_id = ?
         ORDER BY m.created_at DESC
         LIMIT ${limit}`,
        [conversationId]
      );
      return messages.reverse();
    } catch (err) {
      console.error('[WorldChannelService] getMessages error:', err);
      throw err;
    }
  },

  async getFullWorldChannel(userId) {
    const world = await this.getOrCreateWorldChannel();
    await this.ensureMember(world.id, userId);
    const messages = await this.getMessages(world.id, 1);
    const lastMsg = messages[0] || null;
    const [unreadRow] = await query(
      `SELECT COUNT(*) as count FROM message m
       LEFT JOIN message_read mr ON m.id = mr.message_id AND mr.user_id = ?
       WHERE m.conversation_id = ? AND m.sender_id != ? AND mr.message_id IS NULL`,
      [userId, world.id, userId]
    );
    return {
      ...world,
      last_message: lastMsg ? (lastMsg.type === 'image' ? '[图片]' : lastMsg.content) : null,
      last_message_time: lastMsg?.created_at || null,
      unread_count: unreadRow?.count || 0,
      messages
    };
  }
};

export default WorldChannelService;
