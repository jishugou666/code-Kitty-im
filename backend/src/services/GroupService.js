import { query } from '../utils/db.js';

export const GroupService = {
  async createGroup(ownerId, name, description, memberIds, needApproval = 0) {
    try {
      if (!name?.trim()) {
        return { code: 400, data: null, msg: '群名称不能为空' };
      }

      const memberList = [...new Set([ownerId, ...(memberIds || [])])];

      const convResult = await query(
        'INSERT INTO conversation (type, name, created_by) VALUES (?, ?, ?)',
        ['group', name.trim(), ownerId]
      );
      const groupId = convResult.insertId;

      for (const userId of memberList) {
        const role = userId === ownerId ? 'owner' : 'member';
        await query(
          'INSERT INTO conversation_member (conversation_id, user_id, role) VALUES (?, ?, ?)',
          [groupId, userId, role]
        );
      }

      await query(
        'INSERT INTO `group` (id, name, description, owner_id, need_approval) VALUES (?, ?, ?, ?, ?)',
        [groupId, name.trim(), description || '', ownerId, needApproval]
      );

      for (const userId of memberList) {
        const role = userId === ownerId ? 'owner' : 'member';
        await query(
          'INSERT INTO group_member (group_id, user_id, role) VALUES (?, ?, ?)',
          [groupId, userId, role]
        );
      }

      const group = await query('SELECT * FROM `group` WHERE id = ?', [groupId]);
      const members = await this.getGroupMembers(groupId);

      return {
        code: 200,
        data: { ...group[0], members },
        msg: '创建成功'
      };
    } catch (err) {
      console.error('createGroup error:', err);
      return { code: 200, data: null, msg: '创建失败' };
    }
  },

  async getGroupMembers(groupId) {
    try {
      const members = await query(
        `SELECT gm.*, u.nickname, u.username, u.avatar
         FROM group_member gm
         JOIN user u ON gm.user_id = u.id
         WHERE gm.group_id = ?`,
        [groupId]
      );
      return members;
    } catch (err) {
      console.error('getGroupMembers error:', err);
      return [];
    }
  },

  async getGroupInfo(groupId, userId) {
    try {
      const groups = await query(
        `SELECT g.*, gm.role,
         (SELECT COUNT(*) FROM group_member WHERE group_id = g.id) as member_count
         FROM \`group\` g
         LEFT JOIN group_member gm ON g.id = gm.group_id AND gm.user_id = ?
         WHERE g.id = ?`,
        [userId, groupId]
      );

      if (!groups || groups.length === 0) {
        return { code: 404, data: null, msg: '群组不存在' };
      }

      const members = await this.getGroupMembers(groupId);

      return {
        code: 200,
        data: { ...groups[0], members },
        msg: '成功'
      };
    } catch (err) {
      console.error('getGroupInfo error:', err);
      return { code: 200, data: null, msg: '获取失败' };
    }
  },

  async getUserGroups(userId) {
    try {
      const groups = await query(
        `SELECT g.*, gm.role as my_role,
         (SELECT COUNT(*) FROM group_member WHERE group_id = g.id) as member_count,
         (SELECT MAX(created_at) FROM message WHERE conversation_id = g.id) as last_message_time,
         (SELECT COUNT(*) FROM message WHERE conversation_id = g.id AND created_at > COALESCE((SELECT MAX(read_at) FROM message_read WHERE user_id = ? AND conversation_id = g.id), '1970-01-01')) as unread_count
         FROM \`group\` g
         JOIN group_member gm ON g.id = gm.group_id AND gm.user_id = ?
         ORDER BY last_message_time DESC`,
        [userId, userId]
      );

      return { code: 200, data: groups, msg: '成功' };
    } catch (err) {
      console.error('getUserGroups error:', err);
      return { code: 200, data: [], msg: '获取失败' };
    }
  },

  async searchGroups(keyword, userId) {
    try {
      const groups = await query(
        `SELECT g.*,
         (SELECT COUNT(*) FROM group_member WHERE group_id = g.id) as member_count,
         EXISTS(SELECT 1 FROM group_member WHERE group_id = g.id AND user_id = ?) as is_member,
         (SELECT gm.role FROM group_member gm WHERE gm.group_id = g.id AND gm.user_id = ?) as my_role
         FROM \`group\` g
         WHERE g.name LIKE ? OR g.description LIKE ?
         ORDER BY member_count DESC
         LIMIT 50`,
        [userId, userId, `%${keyword}%`, `%${keyword}%`]
      );

      return { code: 200, data: groups, msg: '成功' };
    } catch (err) {
      console.error('searchGroups error:', err);
      return { code: 200, data: [], msg: '搜索失败' };
    }
  },

  async joinGroup(groupId, userId) {
    try {
      const groups = await query('SELECT * FROM `group` WHERE id = ?', [groupId]);
      if (!groups || groups.length === 0) {
        return { code: 404, data: null, msg: '群组不存在' };
      }

      const existing = await query(
        'SELECT * FROM group_member WHERE group_id = ? AND user_id = ?',
        [groupId, userId]
      );

      if (existing && existing.length > 0) {
        return { code: 400, data: null, msg: '已在群中' };
      }

      const group = groups[0];

      if (group.need_approval === 1) {
        await query(
          'INSERT INTO group_join_request (group_id, user_id, status) VALUES (?, ?, "pending")',
          [groupId, userId]
        );
        return { code: 200, data: null, msg: '申请已提交，等待审核' };
      } else {
        await query(
          'INSERT INTO group_member (group_id, user_id, role) VALUES (?, ?, "member")',
          [groupId, userId]
        );
        await query(
          'INSERT INTO conversation_member (conversation_id, user_id, role) VALUES (?, ?, "member")',
          [groupId, userId]
        );
        return { code: 200, data: null, msg: '加入成功' };
      }
    } catch (err) {
      console.error('joinGroup error:', err);
      return { code: 200, data: null, msg: '加入失败' };
    }
  },

  async leaveGroup(groupId, userId) {
    try {
      const members = await query(
        'SELECT * FROM group_member WHERE group_id = ? AND user_id = ?',
        [groupId, userId]
      );

      if (!members || members.length === 0) {
        return { code: 400, data: null, msg: '不在群中' };
      }

      if (members[0].role === 'owner') {
        const memberCount = await query(
          'SELECT COUNT(*) as count FROM group_member WHERE group_id = ?',
          [groupId]
        );
        if (memberCount[0].count > 1) {
          return { code: 400, data: null, msg: '群主不能退出，请先转让群组' };
        }
        await query('DELETE FROM group_member WHERE group_id = ?', [groupId]);
        await query('DELETE FROM conversation_member WHERE conversation_id = ?', [groupId]);
        await query('DELETE FROM conversation WHERE id = ?', [groupId]);
        await query('DELETE FROM `group` WHERE id = ?', [groupId]);
      } else {
        await query(
          'DELETE FROM group_member WHERE group_id = ? AND user_id = ?',
          [groupId, userId]
        );
        await query(
          'DELETE FROM conversation_member WHERE conversation_id = ? AND user_id = ?',
          [groupId, userId]
        );
      }

      return { code: 200, data: null, msg: '退出成功' };
    } catch (err) {
      console.error('leaveGroup error:', err);
      return { code: 200, data: null, msg: '退出失败' };
    }
  },

  async setAdmin(groupId, userId, isAdmin) {
    try {
      await query(
        'UPDATE group_member SET role = ? WHERE group_id = ? AND user_id = ?',
        [isAdmin ? 'admin' : 'member', groupId, userId]
      );
      return { code: 200, data: null, msg: isAdmin ? '已设为管理员' : '已取消管理员' };
    } catch (err) {
      console.error('setAdmin error:', err);
      return { code: 200, data: null, msg: '设置失败' };
    }
  },

  async removeMember(groupId, userId) {
    try {
      await query(
        'DELETE FROM group_member WHERE group_id = ? AND user_id = ? AND role != "owner"',
        [groupId, userId]
      );
      await query(
        'DELETE FROM conversation_member WHERE conversation_id = ? AND user_id = ?',
        [groupId, userId]
      );
      return { code: 200, data: null, msg: '已移出群聊' };
    } catch (err) {
      console.error('removeMember error:', err);
      return { code: 200, data: null, msg: '移除失败' };
    }
  },

  async getJoinRequests(groupId) {
    try {
      const requests = await query(
        `SELECT r.*, u.nickname, u.username, u.avatar
         FROM group_join_request r
         JOIN user u ON r.user_id = u.id
         WHERE r.group_id = ? AND r.status = 'pending'`,
        [groupId]
      );
      return { code: 200, data: requests, msg: '成功' };
    } catch (err) {
      console.error('getJoinRequests error:', err);
      return { code: 200, data: [], msg: '获取失败' };
    }
  },

  async handleJoinRequest(requestId, approved) {
    try {
      const requests = await query(
        'SELECT * FROM group_join_request WHERE id = ?',
        [requestId]
      );

      if (!requests || requests.length === 0) {
        return { code: 404, data: null, msg: '申请不存在' };
      }

      const request = requests[0];

      await query(
        'UPDATE group_join_request SET status = ? WHERE id = ?',
        [approved ? 'approved' : 'rejected', requestId]
      );

      if (approved) {
        await query(
          'INSERT INTO group_member (group_id, user_id, role) VALUES (?, ?, "member")',
          [request.group_id, request.user_id]
        );
        await query(
          'INSERT INTO conversation_member (conversation_id, user_id, role) VALUES (?, ?, "member")',
          [request.group_id, request.user_id]
        );
      }

      return { code: 200, data: null, msg: approved ? '已通过' : '已拒绝' };
    } catch (err) {
      console.error('handleJoinRequest error:', err);
      return { code: 200, data: null, msg: '处理失败' };
    }
  },

  async updateGroup(groupId, ownerId, name, description, needApproval) {
    try {
      const groups = await query('SELECT * FROM `group` WHERE id = ?', [groupId]);
      if (!groups || groups.length === 0) {
        return { code: 404, data: null, msg: '群组不存在' };
      }

      if (groups[0].owner_id !== ownerId) {
        return { code: 403, data: null, msg: '只有群主可以修改' };
      }

      await query(
        'UPDATE `group` SET name = ?, description = ?, need_approval = ? WHERE id = ?',
        [name || groups[0].name, description ?? groups[0].description, needApproval ?? groups[0].need_approval, groupId]
      );

      return { code: 200, data: null, msg: '修改成功' };
    } catch (err) {
      console.error('updateGroup error:', err);
      return { code: 200, data: null, msg: '修改失败' };
    }
  },

  async deleteGroup(groupId, userId) {
    try {
      const groups = await query('SELECT * FROM `group` WHERE id = ?', [groupId]);
      if (!groups || groups.length === 0) {
        return { code: 404, data: null, msg: '群组不存在' };
      }

      if (groups[0].owner_id !== userId) {
        return { code: 403, data: null, msg: '只有群主可以解散' };
      }

      await query('DELETE FROM group_join_request WHERE group_id = ?', [groupId]);
      await query('DELETE FROM group_member WHERE group_id = ?', [groupId]);
      await query('DELETE FROM `group` WHERE id = ?', [groupId]);

      return { code: 200, data: null, msg: '解散成功' };
    } catch (err) {
      console.error('deleteGroup error:', err);
      return { code: 200, data: null, msg: '解散失败' };
    }
  }
};