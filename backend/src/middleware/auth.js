import { verifyToken } from '../utils/crypto.js';
import { unauthorized } from '../utils/response.js';
import { query } from '../utils/db.js';

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

    const users = await query(
      'SELECT id, username, nickname, avatar, email, phone, status, role FROM user WHERE id = ?',
      [decoded.id]
    );
    if (users.length === 0) {
      return res.status(401).json(unauthorized('User not found'));
    }

    req.user = users[0];
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
