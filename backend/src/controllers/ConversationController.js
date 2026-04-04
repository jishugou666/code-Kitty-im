import { ConversationService } from '../services/ConversationService.js';
import { success, error, notFound, forbidden } from '../utils/response.js';

export const ConversationController = {
  async createSingle(req, res, next) {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json(error('User ID is required', 400));
      }

      const conversationId = await ConversationService.createSingleConversation(req.user.id, userId);
      const conversation = await ConversationService.getConversation(conversationId, req.user.id);
      res.status(201).json(success({ id: conversationId, ...conversation }, 'Conversation created'));
    } catch (err) {
      next(err);
    }
  },

  async createGroup(req, res, next) {
    try {
      const { name, memberIds } = req.body;
      if (!name) {
        return res.status(400).json(error('Group name is required', 400));
      }

      const conversationId = await ConversationService.createGroupConversation(name, req.user.id, memberIds || []);
      const conversation = await ConversationService.getConversation(conversationId, req.user.id);
      res.status(201).json(success({ id: conversationId, ...conversation }, 'Group created'));
    } catch (err) {
      next(err);
    }
  },

  async getList(req, res, next) {
    try {
      const conversations = await ConversationService.getConversationList(req.user.id);
      res.json(success(conversations));
    } catch (err) {
      next(err);
    }
  },

  async getConversation(req, res, next) {
    try {
      const { id } = req.params;
      const conversation = await ConversationService.getConversation(parseInt(id), req.user.id);
      const members = await ConversationService.getConversationMembers(parseInt(id));
      res.json(success({ ...conversation, members }));
    } catch (err) {
      if (err.message === 'Conversation not found') {
        return res.status(404).json(notFound('Conversation not found'));
      }
      next(err);
    }
  },

  async getMembers(req, res, next) {
    try {
      const { id } = req.params;
      const members = await ConversationService.getConversationMembers(parseInt(id));
      res.json(success(members));
    } catch (err) {
      next(err);
    }
  },

  async addMembers(req, res, next) {
    try {
      const { id } = req.params;
      const { memberIds } = req.body;
      if (!memberIds || !Array.isArray(memberIds)) {
        return res.status(400).json(error('Member IDs array is required', 400));
      }

      await ConversationService.getConversation(parseInt(id), req.user.id);
      const members = await ConversationService.addMembers(parseInt(id), req.user.id, memberIds);
      res.json(success(members, 'Members added'));
    } catch (err) {
      if (err.message === 'Conversation not found') {
        return res.status(404).json(notFound('Conversation not found'));
      }
      next(err);
    }
  },

  async removeMember(req, res, next) {
    try {
      const { id, userId } = req.params;
      await ConversationService.removeMember(parseInt(id), req.user.id, parseInt(userId));
      res.json(success(null, 'Member removed'));
    } catch (err) {
      next(err);
    }
  }
};
