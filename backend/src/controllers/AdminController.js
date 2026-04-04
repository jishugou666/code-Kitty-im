import { AdminService } from '../services/AdminService.js';
import { getAIStats } from '../services/AIService.js';

export const AdminController = {
  async getDashboard(req, res, next) {
    try {
      const result = await AdminService.getDashboard();
      res.json(result);
    } catch (err) {
      console.error('getDashboard error:', err);
      res.json({ code: 200, data: null, msg: '获取失败' });
    }
  },

  async getUsers(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await AdminService.getUsers(parseInt(page) || 1, parseInt(limit) || 20);
      res.json(result);
    } catch (err) {
      console.error('getUsers error:', err);
      res.json({ code: 200, data: { list: [], total: 0 }, msg: '获取失败' });
    }
  },

  async updateUserStatus(req, res, next) {
    try {
      const { userId, status } = req.body;
      const result = await AdminService.updateUserStatus(userId, status);
      res.json(result);
    } catch (err) {
      console.error('updateUserStatus error:', err);
      res.json({ code: 200, data: null, msg: '更新失败' });
    }
  },

  async updateUserRole(req, res, next) {
    try {
      const { userId, role } = req.body;
      const result = await AdminService.updateUserRole(userId, role);
      res.json(result);
    } catch (err) {
      console.error('updateUserRole error:', err);
      res.json({ code: 200, data: null, msg: '更新失败' });
    }
  },

  async deleteUser(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await AdminService.deleteUser(parseInt(userId));
      res.json(result);
    } catch (err) {
      console.error('deleteUser error:', err);
      res.json({ code: 200, data: null, msg: '删除失败' });
    }
  },

  async getMessages(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { page, limit } = req.query;
      const result = await AdminService.getMessages(parseInt(conversationId), parseInt(page) || 1, parseInt(limit) || 50);
      res.json(result);
    } catch (err) {
      console.error('getMessages error:', err);
      res.json({ code: 200, data: { list: [], total: 0 }, msg: '获取失败' });
    }
  },

  async getConversations(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await AdminService.getConversations(parseInt(page) || 1, parseInt(limit) || 20);
      res.json(result);
    } catch (err) {
      console.error('getConversations error:', err);
      res.json({ code: 200, data: { list: [], total: 0 }, msg: '获取失败' });
    }
  },

  async getMoments(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await AdminService.getMoments(parseInt(page) || 1, parseInt(limit) || 20);
      res.json(result);
    } catch (err) {
      console.error('getMoments error:', err);
      res.json({ code: 200, data: { list: [], total: 0 }, msg: '获取失败' });
    }
  },

  async deleteMoment(req, res, next) {
    try {
      const { momentId } = req.params;
      const result = await AdminService.deleteMoment(parseInt(momentId));
      res.json(result);
    } catch (err) {
      console.error('deleteMoment error:', err);
      res.json({ code: 200, data: null, msg: '删除失败' });
    }
  },

  async getTables(req, res, next) {
    try {
      const result = await AdminService.getTables();
      res.json(result);
    } catch (err) {
      console.error('getTables error:', err);
      res.json({ code: 200, data: [], msg: '获取失败' });
    }
  },

  async getTableData(req, res, next) {
    try {
      const { tableName } = req.params;
      const { page, limit } = req.query;
      const result = await AdminService.getTableData(tableName, parseInt(page) || 1, parseInt(limit) || 50);
      res.json(result);
    } catch (err) {
      console.error('getTableData error:', err);
      res.json({ code: 200, data: { list: [], total: 0 }, msg: '获取失败' });
    }
  },

  async executeQuery(req, res, next) {
    try {
      const { sql } = req.body;
      const result = await AdminService.executeQuery(sql);
      res.json(result);
    } catch (err) {
      console.error('executeQuery error:', err);
      res.json({ code: 200, data: null, msg: '执行失败' });
    }
  },

  async getAIStats(req, res, next) {
    try {
      const stats = getAIStats();
      res.json({ code: 200, data: stats, msg: '成功' });
    } catch (err) {
      console.error('getAIStats error:', err);
      res.json({ code: 200, data: null, msg: '获取失败' });
    }
  },

  async getGroups(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await AdminService.getGroups(parseInt(page) || 1, parseInt(limit) || 20);
      res.json(result);
    } catch (err) {
      console.error('getGroups error:', err);
      res.json({ code: 200, data: { list: [], total: 0 }, msg: '获取失败' });
    }
  },

  async getGroupMembers(req, res, next) {
    try {
      const { groupId } = req.params;
      const result = await AdminService.getGroupMembers(parseInt(groupId));
      res.json(result);
    } catch (err) {
      console.error('getGroupMembers error:', err);
      res.json({ code: 200, data: [], msg: '获取失败' });
    }
  },

  async deleteGroup(req, res, next) {
    try {
      const { groupId } = req.params;
      const result = await AdminService.deleteGroup(parseInt(groupId));
      res.json(result);
    } catch (err) {
      console.error('deleteGroup error:', err);
      res.json({ code: 200, data: null, msg: '删除失败' });
    }
  }
};