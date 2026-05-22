import { query } from '../utils/db.js';
import pusher from '../utils/pusher.js';

const messageTracking = new Map();
const ipTracking = new Map();

const CONFIG = {
  maxMessagesPerWindow: 5,
  windowMs: 5000,
  repeatThreshold: 2,
  cooldownMs: 3000,
  maxConcurrent: 3,
  blockThreshold: 50,
  cleanupIntervalMs: 60000,
  maxUserDataAgeMs: 300000,
  maxIPDataAgeMs: 600000,
  maxMapSize: 10000
};

class AntiSpamService {
  constructor() {
    this.cooldownUsers = new Set();
    this.cooldownIPs = new Set();
    this.lastMessages = new Map();
    this.monitoredConversations = new Set();
    this.messagesProcessed = 0;
    this.threatsBlocked = 0;
    this.cleanupTimer = null;
    this.startCleanupTimer();
  }

  startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, CONFIG.cleanupIntervalMs);
  }

  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  performCleanup() {
    const now = Date.now();
    let userCleaned = 0;
    let ipCleaned = 0;

    for (const [userId, data] of messageTracking.entries()) {
      if (now - (data.lastActivity || data.messages[data.messages.length - 1]?.timestamp || 0) > CONFIG.maxUserDataAgeMs) {
        messageTracking.delete(userId);
        this.lastMessages.delete(userId);
        if (data.conversationId) {
          this.monitoredConversations.delete(data.conversationId);
        }
        userCleaned++;
      }
    }

    for (const [ip, data] of ipTracking.entries()) {
      if (now - (data.lastActivity || data.messages[data.messages.length - 1]?.timestamp || 0) > CONFIG.maxIPDataAgeMs) {
        ipTracking.delete(ip);
        ipCleaned++;
      }
    }

    if (messageTracking.size > CONFIG.maxMapSize) {
      const excessCount = messageTracking.size - CONFIG.maxMapSize;
      const entriesToDelete = Array.from(messageTracking.entries()).slice(0, excessCount);
      for (const [userId] of entriesToDelete) {
        this.clearUserData(userId);
        userCleaned++;
      }
    }

    if (ipTracking.size > CONFIG.maxMapSize) {
      const excessCount = ipTracking.size - CONFIG.maxMapSize;
      const entriesToDelete = Array.from(ipTracking.entries()).slice(0, excessCount);
      for (const [ip] of entriesToDelete) {
        this.clearIPData(ip);
        ipCleaned++;
      }
    }

    if (userCleaned > 0 || ipCleaned > 0) {
      console.log(`[AntiSpam] Cleanup: removed ${userCleaned} users, ${ipCleaned} IPs. Current: ${messageTracking.size} users, ${ipTracking.size} IPs`);
    }
  }

  generateFingerprint(reqOrIp) {
    let ip = 'unknown';
    let userAgent = 'unknown';

    if (typeof reqOrIp === 'string') {
      ip = reqOrIp;
    } else if (reqOrIp && typeof reqOrIp === 'object') {
      ip = reqOrIp.ip || reqOrIp.headers?.['x-forwarded-for'] || reqOrIp.connection?.remoteAddress || 'unknown';
      userAgent = reqOrIp.headers?.['user-agent'] || 'unknown';
    }

    return `${ip}:${String(userAgent).substring(0, 50)}`;
  }

  isUserInCooldown(userId) {
    return this.cooldownUsers.has(userId);
  }

  isIPInCooldown(ip) {
    return this.cooldownIPs.has(ip);
  }

  cooldownUser(userId, durationMs = CONFIG.cooldownMs) {
    this.cooldownUsers.add(userId);
    setTimeout(() => {
      this.cooldownUsers.delete(userId);
    }, durationMs);
  }

  cooldownIP(ip, durationMs = CONFIG.cooldownMs) {
    this.cooldownIPs.add(ip);
    setTimeout(() => {
      this.cooldownIPs.delete(ip);
    }, durationMs);
  }

  async updateServiceStatus() {
    try {
      const rows = await query(
        `SELECT * FROM ai_service_status WHERE service_name = 'antiSpam' LIMIT 1`
      );

      const taskDetail = {
        monitored_conversations: this.monitoredConversations.size,
        messages_processed: this.messagesProcessed,
        threats_blocked: this.threatsBlocked,
        cooldown_users: this.cooldownUsers.size
      };

      if (rows.length === 0) {
        await query(
          `INSERT INTO ai_service_status (service_name, status, current_task, task_progress, task_detail, metrics)
           VALUES ('antiSpam', 'running', ?, 100, ?, '{"cpu": 0, "memory": 0}')`,
          [`监控中: ${this.monitoredConversations.size}个活跃会话`, JSON.stringify(taskDetail)]
        );
      } else {
        await query(
          `UPDATE ai_service_status SET current_task = ?, task_detail = ?, last_heartbeat = CURRENT_TIMESTAMP
           WHERE service_name = 'antiSpam'`,
          [`监控中: ${this.monitoredConversations.size}个活跃会话`, JSON.stringify(taskDetail)]
        );
      }

      pusher.trigger('ai-service-status', 'status-update', {
        service: 'antiSpam',
        status: 'running',
        task: `监控中: ${this.monitoredConversations.size}个活跃会话`,
        detail: taskDetail,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('[AntiSpam] Failed to update service status:', error);
    }
  }

  analyzeMessagePattern(userId, ip, messageContent, messageId = null, conversationId = null) {
    const now = Date.now();

    if (!messageTracking.has(userId)) {
      messageTracking.set(userId, {
        messages: [],
        lastMessage: null,
        repeatCount: 0,
        totalScore: 0,
        conversationId
      });
    }

    const userData = messageTracking.get(userId);
    if (conversationId) {
      userData.conversationId = conversationId;
      this.monitoredConversations.add(conversationId);
    }

    userData.messages = userData.messages.filter(m => now - m.timestamp < CONFIG.windowMs);

    if (!ipTracking.has(ip)) {
      ipTracking.set(ip, {
        messages: [],
        users: new Set(),
        totalScore: 0
      });
    }

    const ipData = ipTracking.get(ip);
    ipData.messages = ipData.messages.filter(m => now - m.timestamp < CONFIG.windowMs);
    ipData.users.add(userId);

    let spamScore = 0;
    let reasons = [];

    if (userData.messages.length >= CONFIG.maxMessagesPerWindow) {
      spamScore += 40;
      reasons.push('消息频率过高(5秒内超过5条)');
    }

    if (userData.lastMessage === messageContent) {
      userData.repeatCount++;
      if (userData.repeatCount >= CONFIG.repeatThreshold) {
        spamScore += 45;
        reasons.push('重复发送相同内容');
      }
    } else {
      userData.repeatCount = 0;
    }

    const similarMessages = userData.messages.filter(m =>
      this.calculateSimilarity(m.content, messageContent) > 0.8
    );
    if (similarMessages.length >= 2) {
      spamScore += 30;
      reasons.push('短时间内发送高度相似内容');
    }

    if (messageContent.length > 2000) {
      spamScore += 20;
      reasons.push('消息过长可能为恶意刷屏');
    }

    if (ipData.users.size > CONFIG.maxConcurrent) {
      spamScore += 25;
      reasons.push('同一IP多个账户异常活动');
    }

    const recentCount = userData.messages.filter(m =>
      now - m.timestamp < 3000
    ).length;
    if (recentCount > 3) {
      spamScore += 20;
      reasons.push('3秒内消息过于密集');
    }

    userData.messages.push({
      content: messageContent,
      timestamp: now,
      messageId
    });
    userData.lastMessage = messageContent;

    ipData.messages.push({
      content: messageContent,
      timestamp: now
    });

    userData.totalScore = Math.max(0, userData.totalScore * 0.8 + spamScore);
    ipData.totalScore = Math.max(0, ipData.totalScore * 0.8 + spamScore);

    this.lastMessages.set(userId, {
      content: messageContent,
      timestamp: now
    });

    this.messagesProcessed++;

    if (this.messagesProcessed % 10 === 0) {
      this.updateServiceStatus();
    }

    const analysis = {
      isSpam: spamScore >= CONFIG.blockThreshold || userData.totalScore >= 60 || ipData.totalScore >= 70,
      score: spamScore,
      userScore: userData.totalScore,
      ipScore: ipData.totalScore,
      reasons,
      confidence: Math.min(100, spamScore + (userData.totalScore + ipData.totalScore) / 2),
      shouldBlock: spamScore >= CONFIG.blockThreshold && spamScore >= 50
    };

    if (analysis.shouldBlock) {
      this.threatsBlocked++;
      if (analysis.userScore >= CONFIG.blockThreshold) {
        this.cooldownUser(userId);
      }
      if (analysis.ipScore >= 70) {
        this.cooldownIP(ip);
      }
    }

    return analysis;
  }

  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;

    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);

    if (maxLen === 0) return 1;

    const matrix = [];
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return 1 - matrix[len1][len2] / maxLen;
  }

  shouldBlock(analysis) {
    return analysis.isSpam && analysis.confidence >= 65;
  }

  getUserStats(userId) {
    const data = messageTracking.get(userId);
    return {
      score: data?.totalScore || 0,
      messageCount: data?.messages?.length || 0,
      isInCooldown: this.isUserInCooldown(userId),
      conversationId: data?.conversationId
    };
  }

  getIPStats(ip) {
    const data = ipTracking.get(ip);
    return {
      score: data?.totalScore || 0,
      messageCount: data?.messages?.length || 0,
      userCount: data?.users?.size || 0,
      isInCooldown: this.isIPInCooldown(ip)
    };
  }

  getServiceStats() {
    return {
      monitoredConversations: this.monitoredConversations.size,
      messagesProcessed: this.messagesProcessed,
      threatsBlocked: this.threatsBlocked,
      cooldownUsers: this.cooldownUsers.size,
      cooldownIPs: this.cooldownIPs.size
    };
  }

  clearUserData(userId) {
    const userData = messageTracking.get(userId);
    if (userData?.conversationId) {
      this.monitoredConversations.delete(userData.conversationId);
    }
    messageTracking.delete(userId);
    this.cooldownUsers.delete(userId);
    this.lastMessages.delete(userId);
  }

  clearIPData(ip) {
    ipTracking.delete(ip);
    this.cooldownIPs.delete(ip);
  }
}

export const antiSpamService = new AntiSpamService();
export default antiSpamService;