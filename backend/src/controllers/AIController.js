import { AIServiceManager } from '../services/AIServiceManager.js';
import { success } from '../utils/response.js';

export const AIController = {
  async getStats(req, res, next) {
    try {
      const stats = AIServiceManager.getAllStats();
      res.json(success(stats, 'AI服务统计获取成功'));
    } catch (err) {
      console.error('获取AI服务统计失败:', err);
      next(err);
    }
  },

  async getCacheStats(req, res, next) {
    try {
      const stats = AIServiceManager.getCacheStats();
      res.json(success(stats, '缓存统计获取成功'));
    } catch (err) {
      console.error('获取缓存统计失败:', err);
      next(err);
    }
  },

  async getAntiSpamStats(req, res, next) {
    try {
      const stats = AIServiceManager.getAntiSpamStats();
      res.json(success(stats, '反垃圾统计获取成功'));
    } catch (err) {
      console.error('获取反垃圾统计失败:', err);
      next(err);
    }
  },

  async getRateLimitStats(req, res, next) {
    try {
      const stats = AIServiceManager.getRateLimiterStats();
      res.json(success(stats, '限流统计获取成功'));
    } catch (err) {
      console.error('获取限流统计失败:', err);
      next(err);
    }
  }
};

export default AIController;