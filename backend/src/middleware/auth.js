import { verifyToken } from '../utils/crypto.js';
import { unauthorized } from '../utils/response.js';
import { query } from '../utils/db.js';
import { IPBanService } from '../services/IPBanService.js';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(unauthorized('No token provided'));
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json(unauthorized('Invalid or expired token'));
    }

    const clientIP = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

    const ipBan = await IPBanService.checkIPBan(clientIP);
    if (ipBan.isBanned) {
      return res.status(403).json({
        code: 403,
        data: null,
        msg: `IP已被封禁${ipBan.reason ? '，原因：' + ipBan.reason : ''}`
      });
    }

    const users = await query(
      'SELECT id, username, nickname, avatar, email, phone, status, role, ban_status, ban_expires_at, ban_reason FROM user WHERE id = ?',
      [decoded.id]
    );
    if (users.length === 0) {
      return res.status(401).json(unauthorized('User not found'));
    }

    const user = users[0];

    if (user.ban_status === 'banned') {
      if (user.ban_expires_at && new Date(user.ban_expires_at) < new Date()) {
        await query('UPDATE user SET ban_status = ? WHERE id = ?', ['active', user.id]);
      } else {
        return res.status(403).json({
          code: 403,
          data: {
            isBanned: true,
            reason: user.ban_reason,
            expiresAt: user.ban_expires_at,
            isPermanent: !user.ban_expires_at
          },
          msg: '账户已被封禁'
        });
      }
    }

    req.user = user;
    req.clientIP = clientIP;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json(unauthorized('Authentication failed'));
  }
}

export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (decoded) {
        req.userId = decoded.id;
      }
    }
    next();
  } catch (error) {
    next();
  }
}
