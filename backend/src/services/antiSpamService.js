const messageTracking = new Map();

const CONFIG = {
  maxMessagesPerWindow: 5,
  windowMs: 5000
};

class AntiSpamService {
  analyzeMessagePattern(userId, ip, messageContent, messageId = null, conversationId = null) {
    const now = Date.now();

    if (!messageTracking.has(userId)) {
      messageTracking.set(userId, { messages: [] });
    }

    const userData = messageTracking.get(userId);
    userData.messages = userData.messages.filter(m => now - m.timestamp < CONFIG.windowMs);

    const recentCount = userData.messages.length;

    userData.messages.push({
      content: messageContent,
      timestamp: now,
      messageId
    });

    const isSpam = recentCount >= CONFIG.maxMessagesPerWindow;

    return {
      isSpam,
      score: isSpam ? 100 : (recentCount / CONFIG.maxMessagesPerWindow) * 40,
      reasons: isSpam ? ['消息频率过高(5秒内超过5条)'] : [],
      confidence: isSpam ? 100 : 0,
      shouldBlock: isSpam
    };
  }

  clearUserData(userId) {
    messageTracking.delete(userId);
  }

  getUserStats(userId) {
    const data = messageTracking.get(userId);
    return {
      messageCount: data?.messages?.length || 0
    };
  }
}

export const antiSpamService = new AntiSpamService();
export default antiSpamService;
