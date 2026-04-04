import { ContactService } from '../services/ContactService.js';
import { success, error, notFound } from '../utils/response.js';

export const ContactController = {
  async addContact(req, res, next) {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json(error('User ID is required', 400));
      }

      const result = await ContactService.addContact(req.user.id, userId);
      res.status(201).json(success(result, 'Contact request sent'));
    } catch (err) {
      if (err.message === 'Cannot add yourself as contact') {
        return res.status(400).json(error('Cannot add yourself as contact', 400));
      }
      if (err.message === 'Contact already exists') {
        return res.status(409).json(error('Contact already exists', 409));
      }
      next(err);
    }
  },

  async acceptContact(req, res, next) {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json(error('User ID is required', 400));
      }

      await ContactService.acceptContact(req.user.id, userId);
      res.json(success(null, 'Contact request accepted'));
    } catch (err) {
      if (err.message === 'Contact request not found') {
        return res.status(404).json(notFound('Contact request not found'));
      }
      next(err);
    }
  },

  async rejectContact(req, res, next) {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json(error('User ID is required', 400));
      }

      await ContactService.rejectContact(req.user.id, userId);
      res.json(success(null, 'Contact request rejected'));
    } catch (err) {
      next(err);
    }
  },

  async blockContact(req, res, next) {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json(error('User ID is required', 400));
      }

      await ContactService.blockContact(req.user.id, userId);
      res.json(success(null, 'Contact blocked'));
    } catch (err) {
      next(err);
    }
  },

  async unblockContact(req, res, next) {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json(error('User ID is required', 400));
      }

      await ContactService.unblockContact(req.user.id, userId);
      res.json(success(null, 'Contact unblocked'));
    } catch (err) {
      next(err);
    }
  },

  async getContactList(req, res, next) {
    try {
      const contacts = await ContactService.getContactList(req.user.id);
      res.json(success(contacts));
    } catch (err) {
      next(err);
    }
  },

  async getPendingRequests(req, res, next) {
    try {
      const requests = await ContactService.getPendingRequests(req.user.id);
      res.json(success(requests));
    } catch (err) {
      next(err);
    }
  },

  async deleteContact(req, res, next) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json(error('User ID is required', 400));
      }

      await ContactService.deleteContact(req.user.id, parseInt(userId));
      res.json(success(null, 'Contact deleted'));
    } catch (err) {
      next(err);
    }
  }
};
