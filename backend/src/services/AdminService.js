import { query } from '../utils/db.js';

export const AdminService = {
  async getDashboard() {
    try {
      const usersCount = await query('SELECT COUNT(*) as count FROM user').catch(() => [{count: 0}]);
      const messagesCount = await query('SELECT COUNT(*) as count FROM message').catch(() => [{count: 0}]);
      const momentsCount = await query('SELECT COUNT(*) as count FROM moments').catch(() => [{count: 0}]);
      const conversationsCount = await query('SELECT COUNT(*) as count FROM conversation').catch(() => [{count: 0}]);

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
      console.error('[Dashboard] Error:', err);
      return { code: 200, data: { totalUsers: 0, totalMessages: 0, totalMoments: 0, totalConversations: 0 }, msg: '部分获取失败' };
    }
  },

  async getUsers(page = 1, limit = 20) {
    try {
      const safeLimit = Math.max(1, parseInt(limit) || 20);
      const safeOffset = Math.max(0, (parseInt(page) - 1) * safeLimit);
      const users = await query(
        `SELECT u.id, u.username, u.nickname, u.avatar, u.email, u.role, u.status,
         COALESCE(u.ban_status, CASE WHEN u.status = 0 THEN 'banned' ELSE 'active' END) as ban_status,
         u.banned_at, u.ban_expires_at, u.ban_reason, u.created_at,
         (SELECT COUNT(*) FROM message WHERE sender_id = u.id) as message_count,
         (SELECT COUNT(*) FROM moments WHERE user_id = u.id) as moments_count,
         (SELECT ip_address FROM user_ip_log WHERE user_id = u.id ORDER BY login_time DESC LIMIT 1) as last_ip
         FROM user u
         ORDER BY created_at DESC
         LIMIT ${safeLimit} OFFSET ${safeOffset}`
      );

      const total = await query('SELECT COUNT(*) as count FROM user');

      return {
        code: 200,
        data: {
          list: users,
          total: total[0]?.count || 0,
          page: parseInt(page),
          limit: safeLimit
        },
        msg: '成功'
      };
    } catch (err) {
      console.error('getUsers error:', err);
      return { code: 200, data: { list: [], total: 0 }, msg: '获取失败' };
    }
  },

  async updateUserStatus(userId, status, adminId = null, reason = null, durationDays = null) {
    try {
      if (status === 0) {
        const expiresAt = durationDays
          ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
          : null;
        await query(
          `UPDATE user SET status = 0 WHERE id = ?`,
          [userId]
        );
        try {
          await query(
            `UPDATE user SET ban_status = 'banned', banned_at = NOW(), ban_expires_at = ?, ban_reason = ?, banned_by = ? WHERE id = ?`,
            [expiresAt, reason, adminId, userId]
          );
        } catch (e) {
          console.log('ban_status字段可能不存在:', e.message);
        }
      } else {
        await query(
          `UPDATE user SET status = 1 WHERE id = ?`,
          [userId]
        );
        try {
          await query(
            `UPDATE user SET ban_status = 'active', banned_at = NULL, ban_expires_at = NULL, ban_reason = NULL, banned_by = NULL WHERE id = ?`,
            [userId]
          );
        } catch (e) {
          console.log('ban_status字段可能不存在:', e.message);
        }
      }
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
      const safeLimit = Math.max(1, parseInt(limit) || 50);
      const safeOffset = Math.max(0, (parseInt(page) - 1) * safeLimit);
      const messages = await query(
        `SELECT m.*, u.nickname as sender_nickname, u.avatar as sender_avatar
         FROM message m
         LEFT JOIN user u ON m.sender_id = u.id
         WHERE m.conversation_id = ?
         ORDER BY m.created_at DESC
         LIMIT ${safeLimit} OFFSET ${safeOffset}`,
        [conversationId]
      );

      const total = await query('SELECT COUNT(*) as count FROM message WHERE conversation_id = ?', [conversationId]);

      return {
        code: 200,
        data: {
          list: messages,
          total: total[0]?.count || 0,
          page: parseInt(page),
          limit: safeLimit
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
      const safeLimit = Math.max(1, parseInt(limit) || 20);
      const safeOffset = Math.max(0, (parseInt(page) - 1) * safeLimit);
      const conversations = await query(
        `SELECT c.*,
         (SELECT COUNT(*) FROM message WHERE conversation_id = c.id) as message_count,
         (SELECT MAX(created_at) FROM message WHERE conversation_id = c.id) as last_message_time
         FROM conversation c
         ORDER BY last_message_time DESC
         LIMIT ${safeLimit} OFFSET ${safeOffset}`
      );

      const total = await query('SELECT COUNT(*) as count FROM conversation');

      return {
        code: 200,
        data: {
          list: conversations,
          total: total[0]?.count || 0,
          page: parseInt(page),
          limit: safeLimit
        },
        msg: '成功'
      };
    } catch (err) {
      console.error('getConversations error:', err);
      return { code: 200, data: { list: [], total: 0 }, msg: '获取失败' };
    }
  },

  async getGroups(page = 1, limit = 20) {
    try {
      const safeLimit = Math.max(1, parseInt(limit) || 20);
      const safeOffset = Math.max(0, (parseInt(page) - 1) * safeLimit);
      const groups = await query(
        `SELECT g.*, u.nickname as owner_name, u.username as owner_username,
         (SELECT COUNT(*) FROM group_member WHERE group_id = g.id) as member_count,
         (SELECT COUNT(*) FROM group_join_request WHERE group_id = g.id AND status = 'pending') as pending_requests
         FROM \`group\` g
         LEFT JOIN user u ON g.owner_id = u.id
         ORDER BY g.created_at DESC
         LIMIT ${safeLimit} OFFSET ${safeOffset}`
      );

      const total = await query('SELECT COUNT(*) as count FROM `group`');

      return {
        code: 200,
        data: {
          list: groups,
          total: total[0]?.count || 0,
          page: parseInt(page),
          limit: safeLimit
        },
        msg: '成功'
      };
    } catch (err) {
      console.error('getGroups error:', err);
      return { code: 200, data: { list: [], total: 0 }, msg: '获取失败' };
    }
  },

  async getGroupMembers(groupId) {
    try {
      const members = await query(
        `SELECT gm.*, u.nickname, u.username, u.avatar, u.email
         FROM group_member gm
         JOIN user u ON gm.user_id = u.id
         WHERE gm.group_id = ?`,
        [groupId]
      );
      return { code: 200, data: members, msg: '成功' };
    } catch (err) {
      console.error('getGroupMembers error:', err);
      return { code: 200, data: [], msg: '获取失败' };
    }
  },

  async deleteGroup(groupId) {
    try {
      await query('DELETE FROM group_join_request WHERE group_id = ?', [groupId]);
      await query('DELETE FROM group_member WHERE group_id = ?', [groupId]);
      await query('DELETE FROM `group` WHERE id = ?', [groupId]);
      return { code: 200, data: null, msg: '删除成功' };
    } catch (err) {
      console.error('deleteGroup error:', err);
      return { code: 200, data: null, msg: '删除失败' };
    }
  },

  async getMoments(page = 1, limit = 20) {
    try {
      const safeLimit = Math.max(1, parseInt(limit) || 20);
      const safeOffset = Math.max(0, (parseInt(page) - 1) * safeLimit);
      const moments = await query(
        `SELECT m.*, u.nickname, u.avatar, u.username,
         (SELECT COUNT(*) FROM moments_like WHERE moment_id = m.id) as likes_count,
         (SELECT COUNT(*) FROM moments_comment WHERE moment_id = m.id) as comments_count
         FROM moments m
         LEFT JOIN user u ON m.user_id = u.id
         ORDER BY m.created_at DESC
         LIMIT ${safeLimit} OFFSET ${safeOffset}`
      );

      const total = await query('SELECT COUNT(*) as count FROM moments');

      return {
        code: 200,
        data: {
          list: moments,
          total: total[0]?.count || 0,
          page: parseInt(page),
          limit: safeLimit
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
      await query('DELETE FROM moments WHERE id = ?', [momentId]);
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
      const safeLimit = Math.max(1, parseInt(limit) || 50);
      const safeOffset = Math.max(0, (parseInt(page) - 1) * safeLimit);

      const allowedTables = ['user', 'conversation', 'message', 'contact', 'moments', 'moments_like', 'moments_comment', 'user_settings', 'temp_conversation'];
      if (!allowedTables.includes(safeTableName)) {
        return { code: 403, data: null, msg: '不允许访问该表' };
      }

      const data = await query(
        `SELECT * FROM ${safeTableName} ORDER BY 1 DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`
      );

      const total = await query(`SELECT COUNT(*) as count FROM ${safeTableName}`);

      return {
        code: 200,
        data: {
          list: data,
          total: total[0]?.count || 0,
          page: parseInt(page),
          limit: safeLimit
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