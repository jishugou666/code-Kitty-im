import { UserService } from '../services/UserService.js';
import { success, error, validationError } from '../utils/response.js';

export const UserController = {
  async register(req, res, next) {
    try {
      const { password, nickname, email } = req.body;

      if (!email || !password || !nickname) {
        return res.status(400).json(validationError('请填写昵称、邮箱和密码'));
      }

      if (password.length < 6) {
        return res.status(400).json(validationError('密码长度不能少于6位'));
      }

      if (nickname.length < 2) {
        return res.status(400).json(validationError('昵称长度不能少于2位'));
      }

      if (nickname.length > 20) {
        return res.status(400).json(validationError('昵称长度不能超过20位'));
      }

      if (/\s/.test(nickname)) {
        return res.status(400).json(validationError('昵称不能包含空格'));
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json(validationError('请输入有效的邮箱地址'));
      }

      const result = await UserService.register(password, nickname, email);
      res.status(201).json(success(result, '注册成功'));
    } catch (err) {
      if (err.message === 'Email already exists') {
        return res.status(409).json(error('该邮箱已被注册', 409));
      }
      if (err.message === 'Nickname already exists') {
        return res.status(409).json(error('该昵称已被使用', 409));
      }
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { loginField, password } = req.body;

      if (!loginField || !password) {
        return res.status(400).json(validationError('请输入账号和密码'));
      }

      const result = await UserService.login(loginField, password);
      res.json(success(result, '登录成功'));
    } catch (err) {
      if (err.message === 'Invalid email/username or password') {
        return res.status(401).json(error('账号或密码错误', 401));
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
  },

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      await UserService.updateStatus(req.user.id, status);
      res.json(success(null, 'Status updated'));
    } catch (err) {
      next(err);
    }
  },

  async getTechGod(req, res, next) {
    try {
      const techGod = await UserService.getTechGod();
      if (!techGod) {
        return res.status(404).json(error('技术负责人不存在', 404));
      }
      res.json(success(techGod));
    } catch (err) {
      next(err);
    }
  }
};
