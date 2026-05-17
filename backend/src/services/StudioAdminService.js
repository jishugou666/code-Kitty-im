import { query } from '../utils/db.js';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../utils/crypto.js';
import config from '../config/index.js';

class StudioAdminService {
  /* ==================== 认证 ==================== */

  async login(username, password) {
    const admin = await query(
      'SELECT id, username, password, role FROM studio_admin WHERE username = ?',
      [username]
    );

    if (!admin.length) {
      throw new Error('用户名或密码错误');
    }

    const isValid = await comparePassword(password, admin[0].password);
    if (!isValid) {
      throw new Error('用户名或密码错误');
    }

    const token = generateToken({ id: admin[0].id, username: admin[0].username, role: admin[0].role }, '24h');
    return { token, username: admin[0].username, role: admin[0].role };
  }

  /* ==================== 配置管理 ==================== */

  async getSettings(section) {
    const whereClause = section ? 'WHERE section = ?' : '';
    const params = section ? [section] : [];
    const rows = await query(
      `SELECT id, section, \`key\` as keyName, value, type, description, sort_order FROM studio_settings ${whereClause} ORDER BY sort_order ASC, id ASC`,
      params
    );

    const result = {};
    rows.forEach(row => {
      if (!result[row.section]) {
        result[row.section] = {};
      }
      result[row.section][row.keyName] = row.type === 'json' ? JSON.parse(row.value) : row.value;
    });

    return section ? result[section] || {} : result;
  }

  async updateSetting(section, keyName, value, type = 'string') {
    const strValue = type === 'json' ? JSON.stringify(value) : String(value);

    const existing = await query(
      'SELECT id FROM studio_settings WHERE section = ? AND `key` = ?',
      [section, keyName]
    );

    if (existing.length) {
      await query(
        'UPDATE studio_settings SET value = ?, type = ?, updated_at = NOW() WHERE section = ? AND `key` = ?',
        [strValue, type, section, keyName]
      );
    } else {
      await query(
        'INSERT INTO studio_settings (section, `key`, value, type) VALUES (?, ?, ?, ?)',
        [section, keyName, strValue, type]
      );
    }

    return { success: true, section, key: keyName };
  }

  async deleteSetting(section, keyName) {
    await query(
      'DELETE FROM studio_settings WHERE section = ? AND `key` = ?',
      [section, keyName]
    );
    return { success: true };
  }

  async batchUpdateSettings(settings) {
    for (const item of settings) {
      await this.updateSetting(item.section, item.key, item.value, item.type);
    }
    return { success: true, count: settings.length };
  }

  /* ==================== Hero 配置 ==================== */

  async getHeroConfig() {
    const settings = await this.getSettings('hero');
    return {
      subtitle: settings.subtitle || '用技术连接世界，让沟通更简单',
      dateText: settings.dateText || '2020.1.15 — 至今',
      countdownTarget: settings.countdownTarget || '2027-01-15T00:00:00',
      countdownLabel: settings.countdownLabel || '距七周年还有',
      primaryButtonText: settings.primaryButtonText || '体验 Code Kitty IM',
      primaryButtonLink: settings.primaryButtonLink || '/',
      secondaryButtonText: settings.secondaryButtonText || '编程猫工作室',
      secondaryButtonLink: settings.secondaryButtonLink || 'https://shequ.codemao.cn/work_shop/549',
    };
  }

  /* ==================== About 配置 ==================== */

  async getAboutConfig() {
    const settings = await this.getSettings('about');
    return {
      title: settings.title || '始于热爱，忠于品质',
      description: settings.description || '',
    };
  }

  /* ==================== CTA 配置 ==================== */

  async getCtaConfig() {
    const settings = await this.getSettings('cta');
    return {
      title: settings.title || '准备好开始了吗？',
      description: settings.description || '加入冰网工作室，体验全新的即时通讯方式',
      primaryButtonText: settings.primaryButtonText || '浏览全部作品',
      primaryButtonLink: settings.primaryButtonLink || 'https://shequ.codemao.cn/work_shop/549',
      secondaryButtonText: settings.secondaryButtonText || '体验 Code Kitty IM',
      secondaryButtonLink: settings.secondaryButtonLink || '/',
    };
  }

  /* ==================== 初始化默认管理员 ==================== */

  async initDefaultAdmin() {
    const existing = await query('SELECT id FROM studio_admin WHERE username = ?', ['admin']);
    if (!existing.length) {
      const hashedPassword = await hashPassword('bws123456');
      await query(
        'INSERT INTO studio_admin (username, `password`, role) VALUES (?, ?, ?)',
        ['admin', hashedPassword, 'admin']
      );
    }
  }
}

export default new StudioAdminService();
