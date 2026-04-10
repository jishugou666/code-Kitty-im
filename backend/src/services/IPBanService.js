import { query } from '../utils/db.js';

export const IPBanService = {
  async checkIPBan(ipAddress) {
    try {
      const bans = await query(
        `SELECT * FROM ip_ban WHERE is_active = 1 AND (
          (ban_type = 'exact' AND ip_address = ?) OR
          (ban_type = 'range' AND ? LIKE CONCAT(ip_address, '%')) OR
          (ban_type = 'subnet' AND ? RLIKE ip_range)
        ) AND (expires_at IS NULL OR expires_at > NOW())`,
        [ipAddress, ipAddress, ipAddress]
      );

      if (bans.length > 0) {
        return {
          isBanned: true,
          reason: bans[0].ban_reason,
          expiresAt: bans[0].expires_at,
          isPermanent: !bans[0].expires_at
        };
      }

      return { isBanned: false };
    } catch (err) {
      console.error('检查IP封禁失败:', err);
      return { isBanned: false };
    }
  },

  async banIP(ipAddress, adminId, reason, durationDays = null, banType = 'exact') {
    try {
      const expiresAt = durationDays
        ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
        : null;

      await query(
        `INSERT INTO ip_ban (ip_address, ban_type, ban_reason, ban_by, expires_at, is_active)
         VALUES (?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE ban_reason = VALUES(ban_reason), expires_at = VALUES(expires_at), ban_by = VALUES(ban_by), is_active = 1`,
        [ipAddress, banType, reason, adminId, expiresAt]
      );

      return { success: true };
    } catch (err) {
      console.error('封禁IP失败:', err);
      return { success: false, error: err.message };
    }
  },

  async unbanIP(ipAddress) {
    try {
      await query(
        'UPDATE ip_ban SET is_active = 0 WHERE ip_address = ?',
        [ipAddress]
      );
      return { success: true };
    } catch (err) {
      console.error('解封IP失败:', err);
      return { success: false, error: err.message };
    }
  },

  async recordUserIP(userId, ipAddress, userAgent) {
    try {
      await query(
        `INSERT INTO user_ip_log (user_id, ip_address, user_agent, login_time)
         VALUES (?, ?, ?, NOW())`,
        [userId, ipAddress, userAgent]
      );
      return { success: true };
    } catch (err) {
      console.error('记录用户IP失败:', err);
      return { success: false, error: err.message };
    }
  },

  async getUserIPHistory(userId, limit = 50) {
    try {
      const logs = await query(
        `SELECT ip_address, user_agent, login_time FROM user_ip_log
         WHERE user_id = ? ORDER BY login_time DESC LIMIT ?`,
        [userId, limit]
      );
      return logs;
    } catch (err) {
      console.error('获取用户IP历史失败:', err);
      return [];
    }
  },

  async getIPStats(ipAddress) {
    try {
      const stats = await query(
        `SELECT
           COUNT(DISTINCT user_id) as user_count,
           COUNT(*) as login_count,
           MAX(login_time) as last_login
         FROM user_ip_log WHERE ip_address = ?`,
        [ipAddress]
      );
      return stats[0] || { user_count: 0, login_count: 0, last_login: null };
    } catch (err) {
      console.error('获取IP统计失败:', err);
      return { user_count: 0, login_count: 0, last_login: null };
    }
  }
};

export default IPBanService;