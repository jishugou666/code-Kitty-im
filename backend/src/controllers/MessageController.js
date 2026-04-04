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
      const message = await MessageService.sendMessage(conversationId, req.user.id, content, type || 'text');
      res.status(201).json(success(message, 'Message sent'));
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
      const { limit, beforeId } = req.query;

      if (!conversationId) {
        return res.status(400).json(error('Conversation ID is required', 400));
      }

      await ConversationService.getConversation(parseInt(conversationId), req.user.id);
      const messages = await MessageService.getMessageList(
        parseInt(conversationId),
        req.user.id,
        parseInt(limit) || 50,
        beforeId ? parseInt(beforeId) : null
      );
      res.json(success(messages));
    } catch (err) {
      if (err.message === 'Conversation not found') {
        return res.status(404).json(notFound('Conversation not found'));
      }
      next(err);
    }
  },

  async searchMessages(req, res, next) {
    try {
      const { keyword, limit } = req.query;

      if (!keyword) {
        return res.status(400).json(error('Keyword is required', 400));
      }

      const messages = await MessageService.searchMessages(
        req.user.id,
        keyword,
        parseInt(limit) || 50
      );
      res.json(success(messages));
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const { conversationId } = req.body;
      if (!conversationId) {
        return res.status(400).json(error('Conversation ID is required', 400));
      }

      await ConversationService.getConversation(conversationId, req.user.id);
      await MessageService.markAsRead(conversationId, req.user.id);
      res.json(success(null, 'Messages marked as read'));
    } catch (err) {
      if (err.message === 'Conversation not found') {
        return res.status(404).json(notFound('Conversation not found'));
      }
      next(err);
    }
  }
};
