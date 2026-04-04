import { query } from '../utils/db.js';

export const AdminService = {
  async getDashboard() {
    try {
      const usersCount = await query('SELECT COUNT(*) as count FROM user');
      const messagesCount = await query('SELECT COUNT(*) as count FROM message');
      const momentsCount = await query('SELECT COUNT(*) as count FROM moments WHERE deleted_at IS NULL');
      const conversationsCount = await query('SELECT COUNT(*) as count FROM conversation');

      return {
        code: 200,
        data: {
          totalUsers: usersCount[0]?.count || 0,
          totalMessages: messagesCount[0]?.count || 0,
          totalMoments: momentsCount[0]?.count || 0,
          totalConversations: conversationsCount[0]?.count || 0
        },
        msg: '成功'
      };
    } catch (err) {
      console.error('getDashboard error:', err);
      return { code: 200, data: null, msg: '获取失败' };
    }
  },

  async getUsers(page = 1, limit = 20) {
    try {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const users = await query(
        `SELECT id, username, nickname, avatar, email, role, status, created_at,
         (SELECT COUNT(*) FROM message WHERE sender_id = user.id) as message_count,
         (SELECT COUNT(*) FROM moments WHERE user_id = user.id AND deleted_at IS NULL) as moments_count
         FROM user
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [parseInt(limit), offset]
      );

      const total = await query('SELECT COUNT(*) as count FROM user');

      return {
        code: 200,
        data: {
          list: users,
          total: total[0]?.count || 0,
          page: parseInt(page),
          limit: parseInt(limit)
        },
        msg: '成功'
      };
    } catch (err) {
      console.error('getUsers error:', err);
      return { code: 200, data: { list: [], total: 0 }, msg: '获取失败' };
    }
  },

  async updateUserStatus(userId, status) {
    try {
      await query('UPDATE user SET status = ? WHERE id = ?', [status, userId]);
      return { code: 200, data: null, msg: '更新成功' };
    } catch (err) {
      console.error('updateUserStatus error:', err);
      return { code: 200, data: null, msg: '更新失败' };
    }
  },

  async updateUserRole(userId, role) {
    try {
      await query('UPDATE user SET role = ? WHERE id = ?', [role, userId]);
      return { code: 200, data: null, msg: '更新成功' };
    } catch (err) {
      console.error('updateUserRole error:', err);
      return { code: 200, data: null, msg: '更新失败' };
    }
  },

  async deleteUser(userId) {
    try {
      await query('DELETE FROM user WHERE id = ?', [userId]);
      return { code: 200, data: null, msg: '删除成功' };
    } catch (err) {
      console.error('deleteUser error:', err);
      return { code: 200, data: null, msg: '删除失败' };
    }
  },

  async getMessages(conversationId, page = 1, limit = 50) {
    try {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const messages = await query(
        `SELECT m.*, u.nickname as sender_nickname, u.avatar as sender_avatar
         FROM message m
         LEFT JOIN user u ON m.sender_id = u.id
         WHERE m.conversation_id = ?
         ORDER BY m.created_at DESC
         LIMIT ? OFFSET ?`,
        [conversationId, parseInt(limit), offset]
      );

      const total = await query('SELECT COUNT(*) as count FROM message WHERE conversation_id = ?', [conversationId]);

      return {
        code: 200,
        data: {
          list: messages,
          total: total[0]?.count || 0,
          page: parseInt(page),
          limit: parseInt(limit)
        },
        msg: '成功'
      };
    } catch (err) {
      console.error('getMessages error:', err);
      return { code: 200, data: { list: [], total: 0 }, msg: '获取失败' };
    }
  },

  async getConversations(page = 1, limit = 20) {
    try {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const conversations = await query(
        `SELECT c.*,
         (SELECT COUNT(*) FROM message WHERE conversation_id = c.id) as message_count,
         (SELECT MAX(created_at) FROM message WHERE conversation_id = c.id) as last_message_time
         FROM conversation c
         ORDER BY last_message_time DESC
         LIMIT ? OFFSET ?`,
        [parseInt(limit), offset]
      );

      const total = await query('SELECT COUNT(*) as count FROM conversation');

      return {
        code: 200,
        data: {
          list: conversations,
          total: total[0]?.count || 0,
          page: parseInt(page),
          limit: parseInt(limit)
        },
        msg: '成功'
      };
    } catch (err) {
      console.error('getConversations error:', err);
      return { code: 200, data: { list: [], total: 0 }, msg: '获取失败' };
    }
  },

  async getMoments(page = 1, limit = 20) {
    try {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const moments = await query(
        `SELECT m.*, u.nickname, u.avatar, u.username,
         (SELECT COUNT(*) FROM moments_like WHERE moment_id = m.id) as likes_count,
         (SELECT COUNT(*) FROM moments_comment WHERE moment_id = m.id AND deleted_at IS NULL) as comments_count
         FROM moments m
         LEFT JOIN user u ON m.user_id = u.id
         WHERE m.deleted_at IS NULL
         ORDER BY m.created_at DESC
         LIMIT ? OFFSET ?`,
        [parseInt(limit), offset]
      );

      const total = await query('SELECT COUNT(*) as count FROM moments WHERE deleted_at IS NULL');

      return {
        code: 200,
        data: {
          list: moments,
          total: total[0]?.count || 0,
          page: parseInt(page),
          limit: parseInt(limit)
        },
        msg: '成功'
      };
    } catch (err) {
      console.error('getMoments error:', err);
      return { code: 200, data: { list: [], total: 0 }, msg: '获取失败' };
    }
  },

  async deleteMoment(momentId) {
    try {
      await query('UPDATE moments SET deleted_at = NOW() WHERE id = ?', [momentId]);
      return { code: 200, data: null, msg: '删除成功' };
    } catch (err) {
      console.error('deleteMoment error:', err);
      return { code: 200, data: null, msg: '删除失败' };
    }
  },

  async getTables() {
    try {
      const tables = await query(
        `SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
         FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
         ORDER BY TABLE_NAME`
      );

      return {
        code: 200,
        data: tables,
        msg: '成功'
      };
    } catch (err) {
      console.error('getTables error:', err);
      return { code: 200, data: [], msg: '获取失败' };
    }
  },

  async getTableData(tableName, page = 1, limit = 50) {
    try {
      const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const allowedTables = ['user', 'conversation', 'message', 'contact', 'moments', 'moments_like', 'moments_comment', 'user_settings'];
      if (!allowedTables.includes(safeTableName)) {
        return { code: 403, data: null, msg: '不允许访问该表' };
      }

      const data = await query(
        `SELECT * FROM ${safeTableName} ORDER BY 1 DESC LIMIT ? OFFSET ?`,
        [parseInt(limit), offset]
      );

      const total = await query(`SELECT COUNT(*) as count FROM ${safeTableName}`);

      return {
        code: 200,
        data: {
          list: data,
          total: total[0]?.count || 0,
          page: parseInt(page),
          limit: parseInt(limit)
        },
        msg: '成功'
      };
    } catch (err) {
      console.error('getTableData error:', err);
      return { code: 200, data: { list: [], total: 0 }, msg: '获取失败' };
    }
  },

  async executeQuery(sql) {
    try {
      const safeSql = sql.trim().toUpperCase();
      if (safeSql.startsWith('SELECT') || safeSql.startsWith('SHOW') || safeSql.startsWith('DESCRIBE')) {
        const result = await query(sql);
        return { code: 200, data: result, msg: '查询成功' };
      } else {
        return { code: 403, data: null, msg: '只允许 SELECT/SHOW/DESCRIBE 操作' };
      }
    } catch (err) {
      console.error('executeQuery error:', err);
      return { code: 200, data: null, msg: '执行失败' };
    }
  }
};