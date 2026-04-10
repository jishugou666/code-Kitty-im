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

    if (user.ban_status === 'banned') {
      if (user.ban_expires_at && new Date(user.ban_expires_at) < new Date()) {
        await query('UPDATE user SET ban_status = ? WHERE id = ?', ['active', user.id]);
      } else {
        const expiresText = user.ban_expires_at
          ? `，将于 ${new Date(user.ban_expires_at).toLocaleString()} 解封`
          : '，永久封禁';
        throw new Error(`账户已被封禁，原因：${user.ban_reason || '违规操作'}${expiresText}`);
      }
    }

    await query('UPDATE user SET status = 1 WHERE id = ?', [user.id]);

    const token = generateToken({ id: user.id, email: user.email });

    return {
      user: this.sanitizeUser(user),
      token
    };
  },

  async getProfile(userId) {
    const users = await query('SELECT id, username, nickname, avatar, email, phone, role, status, ban_status, banned_at, ban_expires_at, ban_reason, created_at FROM user WHERE id = ?', [userId]);
    if (users.length === 0) {
      throw new Error('User not found');
    }
    const user = users[0];

    if (user.ban_status === 'banned') {
      if (user.ban_expires_at && new Date(user.ban_expires_at) < new Date()) {
        await query('UPDATE user SET ban_status = ? WHERE id = ?', ['active', userId]);
        user.ban_status = 'active';
      } else {
        const banInfo = {
          isBanned: true,
          reason: user.ban_reason,
          expiresAt: user.ban_expires_at,
          isPermanent: !user.ban_expires_at
        };
        return { ...this.sanitizeUser(user), ...banInfo };
      }
    }

    return this.sanitizeUser(user);
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
      'SELECT id, username, nickname, avatar, email, phone, role, status, ban_status, banned_at, ban_expires_at, ban_reason, created_at FROM user WHERE id = ?',
      [userId]
    );
    return users.length > 0 ? this.sanitizeUser(users[0]) : null;
  },

  async checkBanStatus(userId) {
    const users = await query(
      'SELECT ban_status, ban_expires_at, ban_reason FROM user WHERE id = ?',
      [userId]
    );
    if (users.length === 0) {
      return { isBanned: false };
    }

    const user = users[0];
    if (user.ban_status !== 'banned') {
      return { isBanned: false };
    }

    if (user.ban_expires_at && new Date(user.ban_expires_at) < new Date()) {
      await query('UPDATE user SET ban_status = ? WHERE id = ?', ['active', userId]);
      return { isBanned: false };
    }

    return {
      isBanned: true,
      reason: user.ban_reason,
      expiresAt: user.ban_expires_at,
      isPermanent: !user.ban_expires_at
    };
  },

  async banUser(userId, adminId, reason, durationDays = null) {
    const expiresAt = durationDays
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      : null;

    await query(
      `UPDATE user SET ban_status = 'banned', banned_at = NOW(), ban_expires_at = ?, ban_reason = ?, banned_by = ? WHERE id = ?`,
      [expiresAt, reason, adminId, userId]
    );
  },

  async unbanUser(userId) {
    await query(
      `UPDATE user SET ban_status = 'active', banned_at = NULL, ban_expires_at = NULL, ban_reason = NULL, banned_by = NULL WHERE id = ?`,
      [userId]
    );
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
    if (sanitized.ban_status === 'banned') {
      sanitized.isBanned = true;
      sanitized.banReason = sanitized.ban_reason;
      sanitized.banExpiresAt = sanitized.ban_expires_at;
      sanitized.isPermanentBan = !sanitized.ban_expires_at;
    }
    delete sanitized.ban_reason;
    delete sanitized.ban_expires_at;
    return sanitized;
  }
};
