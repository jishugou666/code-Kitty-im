import { query } from '../utils/db.js';
import { hashPassword, comparePassword, generateToken, maskPhone, maskEmail } from '../utils/crypto.js';

export const UserService = {
  async register(username, password, nickname, email, phone) {
    const existing = await query('SELECT id FROM user WHERE username = ?', [username]);
    if (existing.length > 0) {
      throw new Error('Username already exists');
    }

    const hashedPassword = await hashPassword(password);
    const result = await query(
      'INSERT INTO user (username, password, nickname, email, phone) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, nickname || username, email || null, phone || null]
    );

    const users = await query('SELECT id, username, nickname, avatar, email, phone, status, created_at FROM user WHERE id = ?', [result.insertId]);
    const user = users[0];

    const token = generateToken({ id: user.id, username: user.username });

    return {
      user: this.sanitizeUser(user),
      token
    };
  },

  async login(username, password) {
    const users = await query('SELECT * FROM user WHERE username = ?', [username]);
    if (users.length === 0) {
      throw new Error('Invalid username or password');
    }

    const user = users[0];
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      throw new Error('Invalid username or password');
    }

    await query('UPDATE user SET status = 1 WHERE id = ?', [user.id]);

    const token = generateToken({ id: user.id, username: user.username });

    return {
      user: this.sanitizeUser(user),
      token
    };
  },

  async getProfile(userId) {
    const users = await query('SELECT id, username, nickname, avatar, email, phone, status, created_at FROM user WHERE id = ?', [userId]);
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
