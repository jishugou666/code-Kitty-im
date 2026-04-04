import { query } from '../utils/db.js';
import { hashPassword, comparePassword, generateToken, maskPhone, maskEmail } from '../utils/crypto.js';

export const UserService = {
  async register(password, nickname, email) {
    const existing = await query('SELECT id FROM user WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await hashPassword(password);
    const result = await query(
      'INSERT INTO user (password, nickname, email, role) VALUES (?, ?, ?, ?)',
      [hashedPassword, nickname, email, 'user']
    );

    const users = await query('SELECT id, username, nickname, avatar, email, phone, role, status, created_at FROM user WHERE id = ?', [result.insertId]);
    const user = users[0];

    const token = generateToken({ id: user.id, email: user.email });

    return {
      user: this.sanitizeUser(user),
      token
    };
  },

  async login(loginField, password) {
    const users = await query(
      'SELECT * FROM user WHERE email = ? OR username = ?',
      [loginField, loginField]
    );
    if (users.length === 0) {
      throw new Error('Invalid email/username or password');
    }

    const user = users[0];
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      throw new Error('Invalid email/username or password');
    }

    await query('UPDATE user SET status = 1 WHERE id = ?', [user.id]);

    const token = generateToken({ id: user.id, email: user.email });

    return {
      user: this.sanitizeUser(user),
      token
    };
  },

  async getProfile(userId) {
    const users = await query('SELECT id, username, nickname, avatar, email, phone, role, status, created_at FROM user WHERE id = ?', [userId]);
    if (users.length === 0) {
      throw new Error('User not found');
    }
    return this.sanitizeUser(users[0]);
  },

  async updateProfile(userId, data) {
    const { nickname, avatar, email, phone } = data;
    await query(
      'UPDATE user SET nickname = ?, avatar = ?, email = ?, phone = ? WHERE id = ?',
      [nickname, avatar, email, phone, userId]
    );
    return this.getProfile(userId);
  },

  async searchUsers(keyword) {
    const users = await query(
      'SELECT id, username, nickname, avatar, status FROM user WHERE username LIKE ? OR nickname LIKE ? LIMIT 20',
      [`%${keyword}%`, `%${keyword}%`]
    );
    return users.map(u => this.sanitizeUser(u, true));
  },

  async logout(userId) {
    await query('UPDATE user SET status = 0 WHERE id = ?', [userId]);
  },

  sanitizeUser(user, searchResult = false) {
    const sanitized = { ...user };
    if (!searchResult) {
      delete sanitized.password;
    }
    if (sanitized.phone) {
      sanitized.phone = maskPhone(sanitized.phone);
    }
    if (sanitized.email) {
      sanitized.email = maskEmail(sanitized.email);
    }
    return sanitized;
  }
};
