import { query } from '../utils/db.js';
import { hashPassword, comparePassword, generateToken, maskPhone, maskEmail } from '../utils/crypto.js';

export const UserService = {
  async register(password, nickname, email) {
    const [existingEmail, existingNickname] = await Promise.all([
      query('SELECT id FROM user WHERE email = ?', [email]),
      query('SELECT id FROM user WHERE nickname = ?', [nickname])
    ]);

    if (existingEmail.length > 0) {
      throw new Error('Email already exists');
    }

    if (existingNickname.length > 0) {
      throw new Error('Nickname already exists');
    }

    const hashedPassword = await hashPassword(password);
    const result = await query(
      'INSERT INTO user (password, nickname, email) VALUES (?, ?, ?)',
      [hashedPassword, nickname, email]
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

    const updates = [];
    const values = [];

    if (nickname !== undefined) {
      updates.push('nickname = ?');
      values.push(nickname);
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }

    if (updates.length === 0) {
      return this.getProfile(userId);
    }

    values.push(userId);
    await query(
      `UPDATE user SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return this.getProfile(userId);
  },

  async searchUsers(keyword) {
    const trimmedKeyword = keyword.trim();
    const users = await query(
      'SELECT id, username, nickname, avatar, status, role FROM user WHERE (username LIKE ? OR nickname LIKE ? OR email LIKE ?) LIMIT 20',
      [`%${trimmedKeyword}%`, `%${trimmedKeyword}%`, `%${trimmedKeyword}%`]
    );
    return users.map(u => this.sanitizeUser(u, true));
  },

  async logout(userId) {
    await query('UPDATE user SET status = 0 WHERE id = ?', [userId]);
  },

  async updateStatus(userId, status) {
    await query('UPDATE user SET status = ? WHERE id = ?', [status, userId]);
  },

  async getTechGod() {
    const users = await query(
      "SELECT id, username, nickname, avatar, email, phone, role, status, created_at FROM user WHERE nickname = '技术狗' LIMIT 1"
    );
    return users.length > 0 ? this.sanitizeUser(users[0]) : null;
  },

  async getUserById(userId) {
    const users = await query(
      'SELECT id, username, nickname, avatar, email, phone, role, status, created_at FROM user WHERE id = ?',
      [userId]
    );
    return users.length > 0 ? this.sanitizeUser(users[0]) : null;
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
