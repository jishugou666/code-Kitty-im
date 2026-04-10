const messageTracking = new Map();
const ipTracking = new Map();

const CONFIG = {
  maxMessagesPerWindow: 10,
  windowMs: 60000,
  repeatThreshold: 3,
  cooldownMs: 5000,
  maxConcurrent: 5,
};

class AntiSpamService {
  constructor() {
    this.userScores = new Map();
    this.ipScores = new Map();
    this.cooldownUsers = new Set();
    this.cooldownIPs = new Set();
    this.lastMessages = new Map();
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

  cooldownUser(userId, durationMs = 60000) {
    this.cooldownUsers.add(userId);
    setTimeout(() => {
      this.cooldownUsers.delete(userId);
    }, durationMs);
  }

  cooldownIP(ip, durationMs = 60000) {
    this.cooldownIPs.add(ip);
    setTimeout(() => {
      this.cooldownIPs.delete(ip);
    }, durationMs);
  }

  analyzeMessagePattern(userId, ip, messageContent) {
    const now = Date.now();
    const fingerprint = this.generateFingerprint({ ip });

    if (!messageTracking.has(userId)) {
      messageTracking.set(userId, {
        messages: [],
        lastMessage: null,
        repeatCount: 0,
        totalScore: 0
      });
    }

    const userData = messageTracking.get(userId);
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
      spamScore += 30;
      reasons.push('消息频率过高');
    }

    if (userData.lastMessage === messageContent) {
      userData.repeatCount++;
      if (userData.repeatCount >= CONFIG.repeatThreshold) {
        spamScore += 40;
        reasons.push('重复发送相同内容');
      }
    } else {
      userData.repeatCount = 0;
    }

    const similarMessages = userData.messages.filter(m =>
      this.calculateSimilarity(m.content, messageContent) > 0.8
    );
    if (similarMessages.length >= 3) {
      spamScore += 25;
      reasons.push('短时间内发送高度相似内容');
    }

    if (ipData.users.size > CONFIG.maxConcurrent) {
      spamScore += 20;
      reasons.push('同一IP多个账户异常活动');
    }

    const recentCount = userData.messages.filter(m =>
      now - m.timestamp < 10000
    ).length;
    if (recentCount > 5) {
      spamScore += 15;
      reasons.push('短时间消息过于密集');
    }

    userData.messages.push({
      content: messageContent,
      timestamp: now
    });
    userData.lastMessage = messageContent;

    ipData.messages.push({
      content: messageContent,
      timestamp: now
    });

    userData.totalScore = Math.max(0, userData.totalScore * 0.9 + spamScore);
    ipData.totalScore = Math.max(0, ipData.totalScore * 0.9 + spamScore);

    this.userScores.set(userId, userData.totalScore);
    this.ipScores.set(ip, ipData.totalScore);

    this.lastMessages.set(userId, {
      content: messageContent,
      timestamp: now
    });

    return {
      isSpam: spamScore >= 50 || userData.totalScore >= 60 || ipData.totalScore >= 70,
      score: spamScore,
      userScore: userData.totalScore,
      ipScore: ipData.totalScore,
      reasons,
      confidence: Math.min(100, spamScore + (userData.totalScore + ipData.totalScore) / 2)
    };
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
    return {
      score: this.userScores.get(userId) || 0,
      messageCount: messageTracking.get(userId)?.messages?.length || 0,
      isInCooldown: this.isUserInCooldown(userId)
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

  clearUserData(userId) {
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