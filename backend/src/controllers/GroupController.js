import { GroupService } from '../services/GroupService.js';

export const GroupController = {
  async create(req, res, next) {
    try {
      const { name, description, memberIds, needApproval } = req.body;
      const result = await GroupService.createGroup(req.user.id, name, description, memberIds, needApproval);
      res.json(result);
    } catch (err) {
      console.error('createGroup error:', err);
      res.json({ code: 200, data: null, msg: '创建失败' });
    }
  },

  async getList(req, res, next) {
    try {
      const result = await GroupService.getUserGroups(req.user.id);
      res.json(result);
    } catch (err) {
      console.error('getUserGroups error:', err);
      res.json({ code: 200, data: [], msg: '获取失败' });
    }
  },

  async getInfo(req, res, next) {
    try {
      const { groupId } = req.params;
      const result = await GroupService.getGroupInfo(parseInt(groupId), req.user.id);
      res.json(result);
    } catch (err) {
      console.error('getGroupInfo error:', err);
      res.json({ code: 200, data: null, msg: '获取失败' });
    }
  },

  async search(req, res, next) {
    try {
      const { keyword } = req.query;
      if (!keyword) {
        return res.json({ code: 200, data: [], msg: '请输入关键词' });
      }
      const result = await GroupService.searchGroups(keyword, req.user.id);
      res.json(result);
    } catch (err) {
      console.error('searchGroups error:', err);
      res.json({ code: 200, data: [], msg: '搜索失败' });
    }
  },

  async join(req, res, next) {
    try {
      const { groupId } = req.params;
      const result = await GroupService.joinGroup(parseInt(groupId), req.user.id);
      res.json(result);
    } catch (err) {
      console.error('joinGroup error:', err);
      res.json({ code: 200, data: null, msg: '加入失败' });
    }
  },

  async leave(req, res, next) {
    try {
      const { groupId } = req.params;
      const result = await GroupService.leaveGroup(parseInt(groupId), req.user.id);
      res.json(result);
    } catch (err) {
      console.error('leaveGroup error:', err);
      res.json({ code: 200, data: null, msg: '退出失败' });
    }
  },

  async setAdmin(req, res, next) {
    try {
      const { groupId, userId } = req.params;
      const { isAdmin } = req.body;
      const result = await GroupService.setAdmin(parseInt(groupId), parseInt(userId), isAdmin);
      res.json(result);
    } catch (err) {
      console.error('setAdmin error:', err);
      res.json({ code: 200, data: null, msg: '设置失败' });
    }
  },

  async removeMember(req, res, next) {
    try {
      const { groupId, userId } = req.params;
      const result = await GroupService.removeMember(parseInt(groupId), parseInt(userId));
      res.json(result);
    } catch (err) {
      console.error('removeMember error:', err);
      res.json({ code: 200, data: null, msg: '移除失败' });
    }
  },

  async getJoinRequests(req, res, next) {
    try {
      const { groupId } = req.params;
      const result = await GroupService.getJoinRequests(parseInt(groupId));
      res.json(result);
    } catch (err) {
      console.error('getJoinRequests error:', err);
      res.json({ code: 200, data: [], msg: '获取失败' });
    }
  },

  async handleJoinRequest(req, res, next) {
    try {
      const { requestId } = req.params;
      const { approved } = req.body;
      const result = await GroupService.handleJoinRequest(parseInt(requestId), approved);
      res.json(result);
    } catch (err) {
      console.error('handleJoinRequest error:', err);
      res.json({ code: 200, data: null, msg: '处理失败' });
    }
  },

  async update(req, res, next) {
    try {
      const { groupId } = req.params;
      const { name, description, needApproval } = req.body;
      const result = await GroupService.updateGroup(parseInt(groupId), req.user.id, name, description, needApproval);
      res.json(result);
    } catch (err) {
      console.error('updateGroup error:', err);
      res.json({ code: 200, data: null, msg: '修改失败' });
    }
  },

  async delete(req, res, next) {
    try {
      const { groupId } = req.params;
      const result = await GroupService.deleteGroup(parseInt(groupId), req.user.id);
      res.json(result);
    } catch (err) {
      console.error('deleteGroup error:', err);
      res.json({ code: 200, data: null, msg: '解散失败' });
    }
  }
};