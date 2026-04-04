import { MessageService } from '../services/MessageService.js';
import { ConversationService } from '../services/ConversationService.js';
import { success, error, notFound } from '../utils/response.js';

export const MessageController = {
  async sendMessage(req, res, next) {
    try {
      const { conversationId, content, type } = req.body;
      if (!conversationId || !content) {
        return res.status(400).json(error('Conversation ID and content are required', 400));
      }

      try {
        await ConversationService.getConversation(conversationId, req.user.id);
      } catch (err) {
        return res.status(404).json(notFound('Conversation not found'));
      }

      const result = await MessageService.sendMessage(conversationId, req.user.id, content, type || 'text');

      res.status(201).json({ code: 201, data: result.data, msg: result.msg || '发送成功' });
    } catch (err) {
      console.error('sendMessage error:', err);
      res.json({ code: 200, data: null, msg: '发送失败' });
    }
  },

  async getMessageList(req, res, next) {
    try {
      const { conversationId } = req.query;
      const { limit } = req.query;

      if (!conversationId) {
        return res.status(400).json(error('Conversation ID is required', 400));
      }

      try {
        await ConversationService.getConversation(parseInt(conversationId), req.user.id);
      } catch (err) {
        return res.status(404).json(notFound('Conversation not found'));
      }

      const result = await MessageService.getMessageList(
        parseInt(conversationId),
        parseInt(limit) || 50
      );

      res.json({ code: 200, data: result.data || [], msg: result.msg || '成功' });
    } catch (err) {
      console.error('getMessageList error:', err);
      res.json({ code: 200, data: [], msg: '暂无消息' });
    }
  },

  async searchMessages(req, res, next) {
    try {
      const { keyword, limit } = req.query;

      if (!keyword) {
        return res.status(400).json(error('Keyword is required', 400));
      }

      const result = await MessageService.searchMessages(
        req.user.id,
        keyword,
        parseInt(limit) || 50
      );

      res.json({ code: 200, data: result.data || [], msg: result.msg || '成功' });
    } catch (err) {
      console.error('searchMessages error:', err);
      res.json({ code: 200, data: [], msg: '搜索失败' });
    }
  },

  async markAsRead(req, res, next) {
    try {
      const { conversationId } = req.body;
      if (!conversationId) {
        return res.status(400).json(error('Conversation ID is required', 400));
      }

      const result = await MessageService.markAsRead(conversationId, req.user.id);
      res.json({ code: 200, data: result.data, msg: result.msg || '成功' });
    } catch (err) {
      console.error('markAsRead error:', err);
      res.json({ code: 200, data: null, msg: '标记失败' });
    }
  }
};
