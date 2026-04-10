import { query } from '../utils/db.js';
import { antiSpamService } from './antiSpamService.js';

const AUDIT_CONFIG = {
  batchSize: 50,
  similarityThreshold: 0.8,
  floodWindowMs: 10000,
  floodThreshold: 10,
  repeatThreshold: 3
};

class MessageAuditor {
  constructor() {
    this.auditCache = new Map();
  }

  async auditConversation(conversationId) {
    const cacheKey = `audit:${conversationId}`;
    const now = Date.now();

    if (this.auditCache.has(cacheKey)) {
      const cached = this.auditCache.get(cacheKey);
      if (now - cached.timestamp < 30000) {
        return cached.result;
      }
    }

    const result = {
      conversationId,
      scannedAt: new Date().toISOString(),
      totalMessages: 0,
      suspiciousUsers: [],
      issues: []
    };

    try {
      const messages = await query(
        `SELECT id, sender_id, content, created_at, type
         FROM message
         WHERE conversation_id = ? AND type = 'text' AND content IS NOT NULL AND content != ''
         ORDER BY created_at ASC`,
        [conversationId]
      );

      if (!messages || messages.length === 0) {
        return result;
      }

      result.totalMessages = messages.length;

      const userMessages = this.groupByUser(messages);

      for (const [userId, userMsgs] of Object.entries(userMessages)) {
        const userIssues = this.analyzeUserMessages(userId, userMsgs);
        if (userIssues.length > 0) {
          result.suspiciousUsers.push({
            userId: parseInt(userId),
            messageCount: userMsgs.length,
            issues: userIssues
          });

          for (const issue of userIssues) {
            await this.reportIssue(userId, conversationId, issue, userMsgs);
          }
        }
      }

      this.auditCache.set(cacheKey, { timestamp: now, result });

      setTimeout(() => {
        this.auditCache.delete(cacheKey);
      }, 30000);

    } catch (error) {
      console.error('[MessageAuditor] Audit failed:', error);
    }

    return result;
  }

  groupByUser(messages) {
    const groups = {};
    for (const msg of messages) {
      if (!groups[msg.sender_id]) {
        groups[msg.sender_id] = [];
      }
      groups[msg.sender_id].push(msg);
    }
    return groups;
  }

  analyzeUserMessages(userId, messages) {
    const issues = [];

    if (messages.length >= AUDIT_CONFIG.floodThreshold) {
      const floodResult = this.detectFlood(messages);
      if (floodResult.detected) {
        issues.push({
          type: 'flood',
          severity: floodResult.severity,
          score: floodResult.score,
          details: {
            messageCount: messages.length,
            timeWindow: floodResult.timeWindow,
            avgInterval: floodResult.avgInterval,
            evidence: floodResult.evidence
          }
        });
      }
    }

    const repeatResult = this.detectRepeat(messages);
    if (repeatResult.detected) {
      issues.push({
        type: 'repeat',
        severity: repeatResult.severity,
        score: repeatResult.score,
        details: {
          repeatCount: repeatResult.repeatCount,
          repeatedContent: repeatResult.repeatedContent,
          evidence: repeatResult.evidence
        }
      });
    }

    const similarityResult = this.detectSimilarity(messages);
    if (similarityResult.detected) {
      issues.push({
        type: 'similarity',
        severity: similarityResult.severity,
        score: similarityResult.score,
        details: {
          similarPairs: similarityResult.similarPairs,
          evidence: similarityResult.evidence
        }
      });
    }

    const longContentResult = this.detectLongContent(messages);
    if (longContentResult.detected) {
      issues.push({
        type: 'longContent',
        severity: longContentResult.severity,
        score: longContentResult.score,
        details: {
          avgLength: longContentResult.avgLength,
          maxLength: longContentResult.maxLength,
          evidence: longContentResult.evidence
        }
      });
    }

    return issues;
  }

  detectFlood(messages) {
    const result = { detected: false, severity: 'low', score: 0, timeWindow: 0, avgInterval: 0, evidence: [] };

    if (messages.length < AUDIT_CONFIG.floodThreshold) {
      return result;
    }

    const now = Date.now();
    const timeWindow = Math.min(
      now - new Date(messages[0].created_at).getTime(),
      AUDIT_CONFIG.floodWindowMs
    );

    const recentMessages = messages.filter(m => {
      const msgTime = new Date(m.created_at).getTime();
      return now - msgTime < AUDIT_CONFIG.floodWindowMs;
    });

    if (recentMessages.length < AUDIT_CONFIG.floodThreshold) {
      return result;
    }

    result.detected = true;
    result.timeWindow = timeWindow;
    result.avgInterval = Math.round(timeWindow / recentMessages.length);

    const intensity = recentMessages.length / (timeWindow / 1000);
    if (intensity > 2) {
      result.severity = 'critical';
      result.score = 80;
    } else if (intensity > 1) {
      result.severity = 'high';
      result.score = 60;
    } else {
      result.severity = 'medium';
      result.score = 40;
    }

    result.evidence = recentMessages.slice(0, 3).map(m => ({
      id: m.id,
      content: m.content?.substring(0, 100),
      created_at: m.created_at
    }));

    return result;
  }

  detectRepeat(messages) {
    const result = { detected: false, severity: 'low', score: 0, repeatCount: 0, repeatedContent: '', evidence: [] };

    const contentCount = {};
    for (const msg of messages) {
      const content = msg.content?.trim();
      if (content) {
        contentCount[content] = (contentCount[content] || 0) + 1;
      }
    }

    const repeats = Object.entries(contentCount).filter(([, count]) => count >= AUDIT_CONFIG.repeatThreshold);

    if (repeats.length === 0) {
      return result;
    }

    result.detected = true;
    const maxRepeat = Math.max(...repeats.map(([, count]) => count));
    result.repeatCount = maxRepeat;
    result.repeatedContent = repeats.find(([, count]) => count === maxRepeat)?.[0] || '';

    if (maxRepeat >= 10) {
      result.severity = 'critical';
      result.score = 85;
    } else if (maxRepeat >= 5) {
      result.severity = 'high';
      result.score = 65;
    } else {
      result.severity = 'medium';
      result.score = 45;
    }

    result.evidence = messages
      .filter(m => m.content?.trim() === result.repeatedContent)
      .slice(0, 3)
      .map(m => ({
        id: m.id,
        content: m.content?.substring(0, 100),
        created_at: m.created_at
      }));

    return result;
  }

  detectSimilarity(messages) {
    const result = { detected: false, severity: 'low', score: 0, similarPairs: 0, evidence: [] };

    const similarPairs = [];

    for (let i = 0; i < messages.length; i++) {
      for (let j = i + 1; j < messages.length; j++) {
        const sim = this.calculateSimilarity(messages[i].content, messages[j].content);
        if (sim >= AUDIT_CONFIG.similarityThreshold) {
          similarPairs.push({ i, j, similarity: sim });
        }
      }
    }

    if (similarPairs.length === 0) {
      return result;
    }

    result.detected = true;
    result.similarPairs = similarPairs.length;

    if (similarPairs.length >= 10) {
      result.severity = 'critical';
      result.score = 75;
    } else if (similarPairs.length >= 5) {
      result.severity = 'high';
      result.score = 55;
    } else {
      result.severity = 'medium';
      result.score = 35;
    }

    result.evidence = similarPairs.slice(0, 3).map(pair => ({
      id1: messages[pair.i].id,
      id2: messages[pair.j].id,
      content1: messages[pair.i].content?.substring(0, 50),
      content2: messages[pair.j].content?.substring(0, 50),
      similarity: Math.round(pair.similarity * 100) + '%'
    }));

    return result;
  }

  detectLongContent(messages) {
    const result = { detected: false, severity: 'low', score: 0, avgLength: 0, maxLength: 0, evidence: [] };

    const lengths = messages.map(m => m.content?.length || 0);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const maxLength = Math.max(...lengths);

    if (maxLength < 1000) {
      return result;
    }

    result.detected = true;
    result.avgLength = Math.round(avgLength);
    result.maxLength = maxLength;

    if (maxLength > 5000) {
      result.severity = 'critical';
      result.score = 70;
    } else if (maxLength > 2000) {
      result.severity = 'high';
      result.score = 50;
    } else {
      result.severity = 'medium';
      result.score = 30;
    }

    result.evidence = messages
      .filter(m => (m.content?.length || 0) > 1000)
      .slice(0, 2)
      .map(m => ({
        id: m.id,
        length: m.content?.length,
        preview: m.content?.substring(0, 100)
      }));

    return result;
  }

  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;

    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);

    if (maxLen === 0) return 1;
    if (len1 > 1000 || len2 > 1000) {
      return this.quickSimilarity(str1, str2);
    }

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

  quickSimilarity(str1, str2) {
    const s1Words = str1.split(/\s+/).slice(0, 20);
    const s2Words = str2.split(/\s+/).slice(0, 20);
    const intersection = s1Words.filter(w => s2Words.includes(w)).length;
    const union = new Set([...s1Words, ...s2Words]).size;
    return union > 0 ? intersection / union : 0;
  }

  async reportIssue(userId, conversationId, issue, messages) {
    const severityMap = { critical: 'critical', high: 'high', medium: 'medium', low: 'low' };
    const severity = severityMap[issue.severity] || 'medium';

    let contentPreview = '';
    if (issue.details.evidence && issue.details.evidence.length > 0) {
      contentPreview = issue.details.evidence[0]?.content || issue.details.evidence[0]?.preview || '';
    }

    let fullContent = messages.map(m => m.content).join('\n').substring(0, 5000);

    const metadata = {
      conversationId,
      issueType: issue.type,
      ...issue.details
    };

    await antiSpamService.saveAIFeedback(
      issue.type === 'longContent' ? 'malicious' : issue.type,
      severity,
      userId,
      'conversation',
      conversationId,
      contentPreview,
      fullContent,
      metadata,
      issue.score,
      `历史消息审计检测: ${issue.type} - ${issue.details.messageCount || issue.details.repeatCount || issue.details.similarPairs || issue.details.maxLength || 0}`
    );
  }

  clearCache(conversationId) {
    this.auditCache.delete(`audit:${conversationId}`);
  }

  clearAllCache() {
    this.auditCache.clear();
  }
}

export const messageAuditor = new MessageAuditor();
export default messageAuditor;