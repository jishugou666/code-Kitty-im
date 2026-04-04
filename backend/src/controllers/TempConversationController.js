import { TempConversationService } from '../services/TempConversationService.js';

export const TempConversationController = {
  async check(req, res, next) {
    try {
      const { conversationId } = req.params;
      const result = await TempConversationService.isTempConversation(parseInt(conversationId), req.user.id);
      res.json(result);
    } catch (err) {
      console.error('check temp conversation error:', err);
      res.json({ code: 200, data: { isTemp: false }, msg: '检查失败' });
    }
  },

  async record(req, res, next) {
    try {
      const { conversationId, targetUserId } = req.body;
      const result = await TempConversationService.recordTempConversation(conversationId, req.user.id, targetUserId);
      res.json(result);
    } catch (err) {
      console.error('record temp conversation error:', err);
      res.json({ code: 200, data: null, msg: '记录失败' });
    }
  },

  async block(req, res, next) {
    try {
      const { conversationId } = req.params;
      const result = await TempConversationService.blockTempConversation(parseInt(conversationId), req.user.id);
      res.json(result);
    } catch (err) {
      console.error('block temp conversation error:', err);
      res.json({ code: 200, data: null, msg: '拉黑失败' });
    }
  }
};