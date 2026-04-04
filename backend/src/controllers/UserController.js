import { UserService } from '../services/UserService.js';
import { success, error, validationError } from '../utils/response.js';

export const UserController = {
  async register(req, res, next) {
    try {
      const { username, password, nickname, email, phone } = req.body;

      if (!username || !password) {
        return res.status(400).json(validationError('Username and password are required'));
      }

      if (password.length < 6) {
        return res.status(400).json(validationError('Password must be at least 6 characters'));
      }

      const result = await UserService.register(username, password, nickname, email, phone);
      res.status(201).json(success(result, 'Registration successful'));
    } catch (err) {
      if (err.message === 'Username already exists') {
        return res.status(409).json(error('Username already exists', 409));
      }
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json(validationError('Username and password are required'));
      }

      const result = await UserService.login(username, password);
      res.json(success(result, 'Login successful'));
    } catch (err) {
      if (err.message === 'Invalid username or password') {
        return res.status(401).json(error('Invalid username or password', 401));
      }
      next(err);
    }
  },

  async getProfile(req, res, next) {
    try {
      const user = await UserService.getProfile(req.user.id);
      res.json(success(user));
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { nickname, avatar, email, phone } = req.body;
      const user = await UserService.updateProfile(req.user.id, { nickname, avatar, email, phone });
      res.json(success(user, 'Profile updated'));
    } catch (err) {
      next(err);
    }
  },

  async searchUsers(req, res, next) {
    try {
      const { keyword } = req.query;
      if (!keyword) {
        return res.status(400).json(validationError('Keyword is required'));
      }
      const users = await UserService.searchUsers(keyword);
      res.json(success(users));
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      await UserService.logout(req.user.id);
      res.json(success(null, 'Logout successful'));
    } catch (err) {
      next(err);
    }
  }
};
