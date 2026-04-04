import { SettingsService } from '../services/SettingsService.js';

export const SettingsController = {
  async getSettings(req, res, next) {
    try {
      const result = await SettingsService.getSettings(req.user.id);
      res.json(result);
    } catch (err) {
      console.error('getSettings error:', err);
      res.json({ code: 200, data: null, msg: '获取失败' });
    }
  },

  async updateSettings(req, res, next) {
    try {
      const result = await SettingsService.updateSettings(req.user.id, req.body);
      res.json(result);
    } catch (err) {
      console.error('updateSettings error:', err);
      res.json({ code: 200, data: null, msg: '更新失败' });
    }
  },

  async updateProfile(req, res, next) {
    try {
      const result = await SettingsService.updateProfile(req.user.id, req.body);
      res.json(result);
    } catch (err) {
      console.error('updateProfile error:', err);
      res.json({ code: 200, data: null, msg: '更新失败' });
    }
  },

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.json({ code: 400, data: null, msg: '密码不能为空' });
      }
      const result = await SettingsService.changePassword(req.user.id, oldPassword, newPassword);
      res.json(result);
    } catch (err) {
      console.error('changePassword error:', err);
      res.json({ code: 200, data: null, msg: '修改失败' });
    }
  }
};