import { query } from '../utils/db.js';

export const ConversationService = {
  async getConversationMembers(conversationId) {
    try {
      const sql = `
        SELECT u.id, u.nickname, u.avatar, u.status, cm.role,
          COALESCE(gm.role, cm.role) as my_role
        FROM conversation_member cm
        LEFT JOIN user u ON cm.user_id = u.id
        LEFT JOIN \`group\` g ON g.id = cm.conversation_id
        LEFT JOIN group_member gm ON gm.group_id = g.id AND gm.user_id = cm.user_id
        WHERE cm.conversation_id = ?
      `;
      const rows = await query(sql, [conversationId]);
      return rows;
    } catch (err) {
      console.error('获取会话成员失败:', err);
      return [];
    }
  },

  async createSingleConversation(userId1, userId2) {
    const existing = await query(
      `SELECT c.id FROM conversation c
       JOIN conversation_member cm1 ON c.id = cm1.conversation_id AND cm1.user_id = ?
       JOIN conversation_member cm2 ON c.id = cm2.conversation_id AND cm2.user_id = ?
       WHERE c.type = 'single'`,
      [userId1, userId2]
    );

    if (existing.length > 0) {
      return existing[0].id;
    }

    const result = await query(
      'INSERT INTO conversation (type, created_by) VALUES (?, ?)',
      ['single', userId1]
    );
    const conversationId = result.insertId;

    await query(
      'INSERT INTO conversation_member (conversation_id, user_id, role) VALUES (?, ?, ?), (?, ?, ?)',
      [conversationId, userId1, 'owner', conversationId, userId2, 'member']
    );

    return conversationId;
  },

  async createGroupConversation(name, userId, memberIds = []) {
    const result = await query(
      'INSERT INTO conversation (type, name, created_by) VALUES (?, ?, ?)',
      ['group', name, userId]
    );
    const conversationId = result.insertId;

    await query(
      'INSERT INTO conversation_member (conversation_id, user_id, role) VALUES (?, ?, ?)',
      [conversationId, userId, 'owner']
    );
    await query(
      'INSERT INTO group_member (group_id, user_id, role) VALUES (?, ?, ?)',
      [conversationId, userId, 'owner']
    );

    for (const memberId of memberIds) {
      if (memberId !== userId) {
        await query(
          'INSERT INTO conversation_member (conversation_id, user_id, role) VALUES (?, ?, ?)',
          [conversationId, memberId, 'member']
        );
        await query(
          'INSERT INTO group_member (group_id, user_id, role) VALUES (?, ?, ?)',
          [conversationId, memberId, 'member']
        );
      }
    }

    return conversationId;
  },

  async getConversationList(userId) {
    try {
      const techGodResult = await query("SELECT id FROM user WHERE nickname = '技术狗' LIMIT 1");
      const techGodId = techGodResult.length > 0 ? techGodResult[0].id : null;

      if (techGodId && techGodId !== userId) {
        const existingConv = await query(
          `SELECT c.id FROM conversation c
           JOIN conversation_member cm1 ON c.id = cm1.conversation_id AND cm1.user_id = ?
           JOIN conversation_member cm2 ON c.id = cm2.conversation_id AND cm2.user_id = ?
           WHERE c.type = 'single'`,
          [userId, techGodId]
        );

        if (existingConv.length === 0) {
          await this.createSingleConversation(userId, techGodId);
        }
      }

      let conversations = await query(
        `SELECT c.*, cm.role,
          (SELECT m.content FROM message m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
          (SELECT m.created_at FROM message m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time,
          (SELECT COUNT(*) FROM message m WHERE m.conversation_id = c.id AND m.sender_id != ? AND m.created_at > COALESCE((SELECT MAX(seen_at) FROM message_read WHERE conversation_id = c.id AND user_id = ?), '1970-01-01')) as unread_count
         FROM conversation c
         JOIN conversation_member cm ON c.id = cm.conversation_id AND cm.user_id = ?
         ORDER BY last_message_time DESC`,
        [userId, userId, userId]
      );

      for (const conv of conversations) {
        conv.members = await this.getConversationMembers(conv.id);
      }

      if (techGodId) {
        const techGodConversations = conversations.filter(c =>
          c.type === 'single' && c.members.some((m) => m.id === techGodId)
        );
        const otherConversations = conversations.filter(c =>
          !(c.type === 'single' && c.members.some((m) => m.id === techGodId))
        );
        conversations = [...techGodConversations, ...otherConversations];
      }

      return conversations;
    } catch (err) {
      console.error('获取会话列表失败:', err);
      return [];
    }
  },

  async getConversation(conversationId, userId) {
    console.log('=== [Service] getConversation 被调用');
    console.log('conversationId:', conversationId, 'userId:', userId);
    const conversations = await query(
      `SELECT c.*, cm.role FROM conversation c
       JOIN conversation_member cm ON c.id = cm.conversation_id AND cm.user_id = ?
       WHERE c.id = ?`,
      [userId, conversationId]
    );
    console.log('查询结果:', conversations);
    console.log('查询结果数量:', conversations.length);

    if (conversations.length === 0) {
      console.log('会话未找到，抛出错误');
      throw new Error('Conversation not found');
    }

    console.log('返回会话信息:', conversations[0]);
    return conversations[0];
  },

  async addMembers(conversationId, userId, memberIds) {
    for (const memberId of memberIds) {
      await query(
        'INSERT IGNORE INTO conversation_member (conversation_id, user_id, role) VALUES (?, ?, ?)',
        [conversationId, memberId, 'member']
      );
      await query(
        'INSERT IGNORE INTO group_member (group_id, user_id, role) VALUES (?, ?, ?)',
        [conversationId, memberId, 'member']
      );
    }
    return this.getConversationMembers(conversationId);
  },

  async removeMember(conversationId, userId, targetUserId) {
    await query(
      'DELETE FROM conversation_member WHERE conversation_id = ? AND user_id = ?',
      [conversationId, targetUserId]
    );
    await query(
      'DELETE FROM group_member WHERE group_id = ? AND user_id = ?',
      [conversationId, targetUserId]
    );
  }
};
