import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { IPBanService } from '../services/IPBanService.js';
import crypto from 'crypto';

const router = Router();

function encryptData(data, key = process.env.API_SECRET || 'default-secret-key') {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptData(encrypted, key = process.env.API_SECRET || 'default-secret-key') {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

router.post('/data/sync', authMiddleware, async (req, res) => {
  try {
    const { action, payload } = req.body;

    if (!payload) {
      return res.status(400).json({ code: 400, msg: '无效请求' });
    }

    const decrypted = decryptData(payload);
    if (!decrypted) {
      return res.status(400).json({ code: 400, msg: '数据解析失败' });
    }

    switch (action) {
      case 'ip_log':
        await IPBanService.recordUserIP(
          req.user.id,
          decrypted.ip || req.clientIP,
          decrypted.ua || req.headers['user-agent'] || ''
        );
        return res.json({ code: 200, msg: '同步成功' });

      case 'get_history':
        const history = await IPBanService.getUserIPHistory(req.user.id, 50);
        return res.json({
          code: 200,
          data: encryptData(history),
          msg: '获取成功'
        });

      default:
        return res.status(400).json({ code: 400, msg: '未知操作' });
    }
  } catch (err) {
    console.error('Data sync error:', err);
    res.status(500).json({ code: 500, msg: '服务器错误' });
  }
});

router.get('/stats/query', authMiddleware, async (req, res) => {
  try {
    const { ip } = req.query;

    if (!ip) {
      return res.status(400).json({ code: 400, msg: 'IP参数缺失' });
    }

    const stats = await IPBanService.getIPStats(ip);
    res.json({ code: 200, data: stats, msg: '查询成功' });
  } catch (err) {
    console.error('Stats query error:', err);
    res.status(500).json({ code: 500, msg: '服务器错误' });
  }
});

export default router;