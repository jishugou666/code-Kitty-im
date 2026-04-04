import { MomentsService } from '../services/MomentsService.js';
import { success, error } from '../utils/response.js';

export const MomentsController = {
  async create(req, res, next) {
    try {
      const { content, images } = req.body;

      const result = await MomentsService.createMoment(req.user.id, content, images || []);

      if (result.code !== 200) {
        return res.status(result.code).json(result);
      }

      res.json(result);
    } catch (err) {
      console.error('create moment error:', err);
      res.json({ code: 200, data: null, msg: '发布失败' });
    }
  },

  async getList(req, res, next) {
    try {
      const { page, limit } = req.query;

      const result = await MomentsService.getMoments(req.user.id, parseInt(page) || 1, parseInt(limit) || 20);

      res.json(result);
    } catch (err) {
      console.error('get moments error:', err);
      res.json({ code: 200, data: [], msg: '获取失败' });
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const result = await MomentsService.deleteMoment(parseInt(id), req.user.id);

      res.json(result);
    } catch (err) {
      console.error('delete moment error:', err);
      res.json({ code: 200, data: null, msg: '删除失败' });
    }
  },

  async like(req, res, next) {
    try {
      const { id } = req.params;

      const result = await MomentsService.likeMoment(parseInt(id), req.user.id);

      res.json(result);
    } catch (err) {
      console.error('like moment error:', err);
      res.json({ code: 200, data: null, msg: '操作失败' });
    }
  },

  async getComments(req, res, next) {
    try {
      const { id } = req.params;

      const result = await MomentsService.getComments(parseInt(id));

      res.json(result);
    } catch (err) {
      console.error('get comments error:', err);
      res.json({ code: 200, data: [], msg: '获取失败' });
    }
  },

  async addComment(req, res, next) {
    try {
      const { id } = req.params;
      const { content, parentId } = req.body;

      const result = await MomentsService.addComment(parseInt(id), req.user.id, content, parentId);

      res.json(result);
    } catch (err) {
      console.error('add comment error:', err);
      res.json({ code: 200, data: null, msg: '评论失败' });
    }
  },

  async deleteComment(req, res, next) {
    try {
      const { commentId } = req.params;

      const result = await MomentsService.deleteComment(parseInt(commentId), req.user.id);

      res.json(result);
    } catch (err) {
      console.error('delete comment error:', err);
      res.json({ code: 200, data: null, msg: '删除失败' });
    }
  },

  async getUserMoments(req, res, next) {
    try {
      const { userId } = req.params;
      const { page, limit } = req.query;

      const result = await MomentsService.getUserMoments(parseInt(userId), req.user.id, parseInt(page) || 1, parseInt(limit) || 20);

      res.json(result);
    } catch (err) {
      console.error('get user moments error:', err);
      res.json({ code: 200, data: [], msg: '获取失败' });
    }
  }
};