import { query } from '../utils/db.js';

export const SettingsService = {
  async getSettings(userId) {
    try {
      let settings = await query(
        'SELECT * FROM user_settings WHERE user_id = ?',
        [userId]
      );

      if (settings.length === 0) {
        await query(
          'INSERT INTO user_settings (user_id) VALUES (?)',
          [userId]
        );
        settings = await query(
          'SELECT * FROM user_settings WHERE user_id = ?',
          [userId]
        );
      }

      return { code: 200, data: settings[0], msg: '成功' };
    } catch (err) {
      console.error('getSettings error:', err);
      return { code: 200, data: null, msg: '获取失败' };
    }
  },

  async updateSettings(userId, settingsData) {
    try {
      const allowedFields = [
        'language', 'theme', 'privacy_mode',
        'notification_sound', 'notification_push',
        'show_online_status', 'allow_stranger_msg'
      ];

      const updates = [];
      const values = [];

      for (const [key, value] of Object.entries(settingsData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (updates.length === 0) {
        return { code: 400, data: null, msg: '没有有效的更新字段' };
      }

      values.push(userId);

      await query(
        `INSERT INTO user_settings (user_id, ${updates.join(', ')})
         VALUES (?, ${updates.map(() => '?').join(', ')})
         ON DUPLICATE KEY UPDATE ${updates.map(u => `${u.split(' = ')[0]} = VALUES(${u.split(' = ')[0]})`).join(', ')}`,
        [userId, ...values.slice(0, -1), userId]
      );

      return this.getSettings(userId);
    } catch (err) {
      console.error('updateSettings error:', err);
      return { code: 200, data: null, msg: '更新失败' };
    }
  },

  async updateProfile(userId, { nickname, avatar, email, phone }) {
    try {
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
        return { code: 400, data: null, msg: '没有有效的更新字段' };
      }

      values.push(userId);

      await query(
        `UPDATE user SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const user = await query(
        'SELECT id, username, nickname, avatar, email, phone, role, status, created_at FROM user WHERE id = ?',
        [userId]
      );

      return { code: 200, data: user[0], msg: '更新成功' };
    } catch (err) {
      console.error('updateProfile error:', err);
      return { code: 200, data: null, msg: '更新失败' };
    }
  },

  async changePassword(userId, oldPassword, newPassword) {
    try {
      const bcrypt = await import('bcrypt');
      const users = await query('SELECT password FROM user WHERE id = ?', [userId]);

      if (users.length === 0) {
        return { code: 404, data: null, msg: '用户不存在' };
      }

      const isMatch = await bcrypt.compare(oldPassword, users[0].password);
      if (!isMatch) {
        return { code: 400, data: null, msg: '原密码错误' };
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await query('UPDATE user SET password = ? WHERE id = ?', [hashedPassword, userId]);

      return { code: 200, data: null, msg: '密码修改成功' };
    } catch (err) {
      console.error('changePassword error:', err);
      return { code: 200, data: null, msg: '修改失败' };
    }
  }
};