import db from '../config/database.js';
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
  feedbackConfidence: 65
};

class AntiSpamService {
  constructor() {
    this.userScores = new Map();
    this.ipScores = new Map();
    this.cooldownUsers = new Set();
    this.cooldownIPs = new Set();
    this.lastMessages = new Map();
    this.monitoredConversations = new Set();
    this.messagesProcessed = 0;
    this.threatsBlocked = 0;
  }

  generateFingerprint(req) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return `${ip}:${userAgent.substring(0, 50)}`;
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

  async saveAIFeedback(type, severity, userId, targetType, targetId, content, contentFull, metadata, aiConfidence, aiAnalysis) {
    try {
      const [result] = await db.execute(
        `INSERT INTO ai_feedback (type, severity, user_id, target_type, target_id, content, content_full, metadata, ai_confidence, ai_analysis, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [type, severity, userId, targetType, targetId, content?.substring(0, 500), contentFull, JSON.stringify(metadata), aiConfidence, aiAnalysis]
      );

      await this.logActivity('detect', 'user', userId, 'success', {
        type, severity, aiConfidence, reasons: aiAnalysis
      });

      return result.insertId;
    } catch (error) {
      console.error('[AntiSpam] Failed to save AI feedback:', error);
      return null;
    }
  }

  async logActivity(action, targetType, targetId, result, details) {
    try {
      await db.execute(
        `INSERT INTO ai_activity_log (service_name, action, target_type, target_id, result, details)
         VALUES ('antiSpam', ?, ?, ?, ?, ?)`,
        [action, targetType, targetId, result, JSON.stringify(details)]
      );
    } catch (error) {
      console.error('[AntiSpam] Failed to log activity:', error);
    }
  }

  async updateServiceStatus() {
    try {
      const [rows] = await db.execute(
        `SELECT * FROM ai_service_status WHERE service_name = 'antiSpam' LIMIT 1`
      );

      const taskDetail = {
        monitored_conversations: this.monitoredConversations.size,
        messages_processed: this.messagesProcessed,
        threats_blocked: this.threatsBlocked,
        active_users: messageTracking.size,
        cooldown_users: this.cooldownUsers.size
      };

      if (rows.length === 0) {
        await db.execute(
          `INSERT INTO ai_service_status (service_name, status, current_task, task_progress, task_detail, metrics)
           VALUES ('antiSpam', 'running', ?, 100, ?, '{"cpu": 0, "memory": 0}')`,
          [`监控中: ${this.monitoredConversations.size}个活跃会话`, JSON.stringify(taskDetail)]
        );
      } else {
        await db.execute(
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
    const fingerprint = this.generateFingerprint({ ip });

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

    this.userScores.set(userId, userData.totalScore);
    this.ipScores.set(ip, ipData.totalScore);

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

    if (analysis.isSpam && analysis.confidence >= CONFIG.feedbackConfidence) {
      const severity = spamScore >= 70 ? 'critical' : spamScore >= 50 ? 'high' : 'medium';
      this.saveAIFeedback(
        'spam',
        severity,
        userId,
        'message',
        messageId,
        messageContent.substring(0, 200),
        messageContent,
        {
          ip,
          reasons: analysis.reasons,
          spamScore,
          userScore: userData.totalScore,
          ipScore: ipData.totalScore,
          messageCount: userData.messages.length
        },
        analysis.confidence,
        analysis.reasons.join('; ')
      );
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
    return analysis.isSpam && analysis.confidence >= CONFIG.feedbackConfidence;
  }

  getUserStats(userId) {
    return {
      score: this.userScores.get(userId) || 0,
      messageCount: messageTracking.get(userId)?.messages?.length || 0,
      isInCooldown: this.isUserInCooldown(userId),
      conversationId: messageTracking.get(userId)?.conversationId
    };
  }

  getIPStats(ip) {
    return {
      score: this.ipScores.get(ip) || 0,
      messageCount: ipTracking.get(ip)?.messages?.length || 0,
      userCount: ipTracking.get(ip)?.users?.size || 0,
      isInCooldown: this.isIPInCooldown(ip)
    };
  }

  getServiceStats() {
    return {
      monitoredConversations: this.monitoredConversations.size,
      messagesProcessed: this.messagesProcessed,
      threatsBlocked: this.threatsBlocked,
      activeUsers: messageTracking.size,
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
    this.userScores.delete(userId);
    this.cooldownUsers.delete(userId);
    this.lastMessages.delete(userId);
  }

  clearIPData(ip) {
    ipTracking.delete(ip);
    this.ipScores.delete(ip);
    this.cooldownIPs.delete(ip);
  }
}

export const antiSpamService = new AntiSpamService();
export default antiSpamService;