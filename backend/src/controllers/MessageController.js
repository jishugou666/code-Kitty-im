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

      await ConversationService.getConversation(conversationId, req.user.id);
      const result = await MessageService.sendMessage(conversationId, req.user.id, content, type || 'text');

      if (result.code !== 200) {
        return res.status(500).json(error('Failed to send message', 500));
      }

      res.status(201).json(success(result.data, 'Message sent'));
    } catch (err) {
      if (err.message === 'Conversation not found') {
        return res.status(404).json(notFound('Conversation not found'));
      }
      next(err);
    }
  },

  async getMessageList(req, res, next) {
    try {
      const { conversationId } = req.query;
      const { limit } = req.query;

      if (!conversationId) {
        return res.status(400).json(error('Conversation ID is required', 400));
      }

      await ConversationService.getConversation(parseInt(conversationId), req.user.id);
      const result = await MessageService.getMessageList(
        parseInt(conversationId),
        parseInt(limit) || 50
      );

      res.json(result);
    } catch (err) {
      if (err.message === 'Conversation not found') {
        return res.status(404).json(notFound('Conversation not found'));
      }
      console.error('getMessageList error:', err);
      res.json({ code: 200, data: [] });
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

      res.json(result);
    } catch (err) {
      console.error('searchMessages error:', err);
      res.json({ code: 200, data: [] });
    }
  },

  async markAsRead(req, res, next) {
    try {
      const { conversationId } = req.body;
      if (!conversationId) {
        return res.status(400).json(error('Conversation ID is required', 400));
      }

      await ConversationService.getConversation(conversationId, req.user.id);
      const result = await MessageService.markAsRead(conversationId, req.user.id);
      res.json(result);
    } catch (err) {
      if (err.message === 'Conversation not found') {
        return res.status(404).json(notFound('Conversation not found'));
      }
      console.error('markAsRead error:', err);
      res.json({ code: 200, data: null });
    }
  }
};
