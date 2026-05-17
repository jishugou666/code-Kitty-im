import { Router } from 'express';
import studioAdminService from '../services/StudioAdminService.js';
import { success, error, validationError, unauthorized } from '../utils/response.js';
import { verifyToken } from '../utils/crypto.js';
import config from '../config/index.js';

const router = Router();

// 认证中间件
const studioAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(unauthorized('未提供认证令牌'));
  }

  const token = authHeader.slice(7);
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json(unauthorized('认证令牌无效或已过期'));
  }
};

// ========== 公开接口 ==========

// 获取前台展示配置
router.get('/config', async (req, res) => {
  try {
    const section = req.query.section;
    const data = await studioAdminService.getSettings(section);
    res.json(success(data));
  } catch (err) {
    res.json(error(err.message));
  }
});

// ========== 认证接口 ==========

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json(validationError('用户名和密码不能为空'));
    }

    const result = await studioAdminService.login(username, password);
    res.json(success(result, '登录成功'));
  } catch (err) {
    res.json(error(err.message));
  }
});

// ========== 需要认证的接口 ==========

// 获取所有配置
router.get('/settings', studioAuth, async (req, res) => {
  try {
    const data = await studioAdminService.getSettings();
    res.json(success(data));
  } catch (err) {
    res.json(error(err.message));
  }
});

// 获取某个区域的配置
router.get('/settings/:section', studioAuth, async (req, res) => {
  try {
    const { section } = req.params;
    const data = await studioAdminService.getSettings(section);
    res.json(success(data));
  } catch (err) {
    res.json(error(err.message));
  }
});

// 更新单个配置
router.put('/settings/:section/:key', studioAuth, async (req, res) => {
  try {
    const { section, key } = req.params;
    const { value, type } = req.body;
    if (value === undefined) {
      return res.json(validationError('配置值不能为空'));
    }

    const result = await studioAdminService.updateSetting(section, key, value, type);
    res.json(success(result, '更新成功'));
  } catch (err) {
    res.json(error(err.message));
  }
});

// 批量更新配置
router.put('/settings/batch', studioAuth, async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || !Array.isArray(settings)) {
      return res.json(validationError('配置数据格式错误'));
    }

    const result = await studioAdminService.batchUpdateSettings(settings);
    res.json(success(result, '批量更新成功'));
  } catch (err) {
    res.json(error(err.message));
  }
});

// 删除配置
router.delete('/settings/:section/:key', studioAuth, async (req, res) => {
  try {
    const { section, key } = req.params;
    const result = await studioAdminService.deleteSetting(section, key);
    res.json(success(result, '删除成功'));
  } catch (err) {
    res.json(error(err.message));
  }
});

// 初始化默认管理员（仅首次使用）
router.post('/init', async (req, res) => {
  try {
    await studioAdminService.initDefaultAdmin();
    res.json(success(null, '管理员初始化成功'));
  } catch (err) {
    res.json(error(err.message));
  }
});

export default router;
