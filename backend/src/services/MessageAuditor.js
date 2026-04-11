import { query } from '../utils/db.js';
import { antiSpamService } from './antiSpamService.js';

const AUDIT_CONFIG = {
  batchSize: 20,
  maxConcurrentBatches: 2,
  processDelayMs: 100,
  similarityThreshold: 0.7,
  floodWindowMs: 10000,
  floodThreshold: 5,
  repeatThreshold: 2,
  scoreThresholds: {
    flood: 40,
    repeat: 45,
    similarity: 30,
    longContent: 20
  }
};

class AuditTaskQueue {
  constructor() {
    this.pendingTasks = new Map();
    this.processingTasks = new Set();
    this.completedTasks = new Map();
    this.workerPool = [];
    this.maxWorkers = AUDIT_CONFIG.maxConcurrentBatches;
    this.isProcessing = false;
  }

  addTask(conversationId, priority = 'normal') {
    const taskId = `audit_${conversationId}_${Date.now()}`;
    const existingTask = this.pendingTasks.get(conversationId);

    if (existingTask && Date.now() - existingTask.timestamp < 60000) {
      return existingTask.taskId;
    }

    this.pendingTasks.set(conversationId, {
      taskId,
      conversationId,
      priority,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    });

    this.scheduleProcessing();
    return taskId;
  }

  async scheduleProcessing() {
    if (this.isProcessing || this.workerPool.length >= this.maxWorkers) {
      return;
    }

    this.isProcessing = true;

    while (this.pendingTasks.size > 0 && this.workerPool.length < this.maxWorkers) {
      const entries = Array.from(this.pendingTasks.entries());
      const [conversationId, task] = entries[0];

      this.pendingTasks.delete(conversationId);
      this.processingTasks.add(task.taskId);

      this.workerPool.push(this.processTask(task));
    }

    await Promise.all(this.workerPool);
    this.workerPool = [];
    this.isProcessing = false;
  }

  async processTask(task) {
    try {
      console.log(`[AuditQueue] 开始处理审计任务: ${task.taskId}, 会话: ${task.conversationId}`);

      const result = await this.processConversationAudit(task.conversationId);

      this.completedTasks.set(task.taskId, {
        ...task,
        status: 'completed',
        completedAt: Date.now(),
        result
      });

      this.processingTasks.delete(task.taskId);

      console.log(`[AuditQueue] 审计任务完成: ${task.taskId}, 发现问题: ${result.issuesFound}`);

    } catch (error) {
      console.error(`[AuditQueue] 审计任务失败: ${task.taskId}`, error);

      task.retryCount++;
      if (task.retryCount < 3) {
        this.pendingTasks.set(task.conversationId, task);
      } else {
        this.completedTasks.set(task.taskId, {
          ...task,
          status: 'failed',
          error: error.message
        });
        this.processingTasks.delete(task.taskId);
      }
    }

    await this.delay(AUDIT_CONFIG.processDelayMs);
  }

  async processConversationAudit(conversationId) {
    const messages = await query(
      `SELECT id, sender_id, content, created_at, type
       FROM message
       WHERE conversation_id = ? AND type = 'text' AND content IS NOT NULL AND content != ''
       ORDER BY created_at ASC`,
      [conversationId]
    ).catch(err => {
      console.error('[AuditQueue] 查询消息失败:', err);
      return [];
    });

    if (!messages || messages.length === 0) {
      return { conversationId, totalMessages: 0, issuesFound: 0 };
    }

    const userMessages = this.groupByUser(messages);
    let issuesFound = 0;

    for (const [userId, userMsgs] of Object.entries(userMessages)) {
      if (userMsgs.length < 2) continue;

      const issues = this.analyzeUserMessages(userId, userMsgs);

      for (const issue of issues) {
        const submitted = await this.submitIssue(userId, conversationId, issue, userMsgs);
        if (submitted) issuesFound++;
      }
    }

    return { conversationId, totalMessages: messages.length, issuesFound };
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

    const floodIssue = this.detectFlood(messages);
    if (floodIssue) issues.push(floodIssue);

    const repeatIssue = this.detectRepeat(messages);
    if (repeatIssue) issues.push(repeatIssue);

    const similarityIssue = this.detectSimilarity(messages);
    if (similarityIssue) issues.push(similarityIssue);

    const longContentIssue = this.detectLongContent(messages);
    if (longContentIssue) issues.push(longContentIssue);

    return issues;
  }

  detectFlood(messages) {
    if (messages.length < AUDIT_CONFIG.floodThreshold) return null;

    const now = Date.now();
    const recentMessages = messages.filter(m => {
      const msgTime = new Date(m.created_at).getTime();
      return now - msgTime < AUDIT_CONFIG.floodWindowMs;
    });

    if (recentMessages.length < AUDIT_CONFIG.floodThreshold) return null;

    const timeWindow = recentMessages.length > 0
      ? now - new Date(recentMessages[0].created_at).getTime()
      : 0;
    const avgInterval = recentMessages.length > 1 ? timeWindow / recentMessages.length : 0;

    return {
      type: 'flood',
      score: AUDIT_CONFIG.scoreThresholds.flood + (recentMessages.length > 8 ? 20 : 0),
      severity: recentMessages.length > 8 ? 'high' : 'medium',
      details: {
        messageCount: recentMessages.length,
        timeWindow,
        avgInterval,
        evidence: recentMessages.slice(0, 3).map(m => ({
          id: m.id,
          content: m.content?.substring(0, 50),
          created_at: m.created_at
        }))
      }
    };
  }

  detectRepeat(messages) {
    const contentCount = {};
    for (const msg of messages) {
      const content = msg.content?.trim();
      if (content) {
        contentCount[content] = (contentCount[content] || 0) + 1;
      }
    }

    const repeats = Object.entries(contentCount).filter(([, count]) => count >= AUDIT_CONFIG.repeatThreshold);
    if (repeats.length === 0) return null;

    const maxRepeat = Math.max(...repeats.map(([, count]) => count));
    const repeatedContent = repeats.find(([, count]) => count === maxRepeat)?.[0] || '';

    return {
      type: 'repeat',
      score: AUDIT_CONFIG.scoreThresholds.repeat + (maxRepeat > 5 ? 15 : 0),
      severity: maxRepeat > 5 ? 'high' : 'medium',
      details: {
        repeatCount: maxRepeat,
        repeatedContent: repeatedContent.substring(0, 100),
        evidence: messages
          .filter(m => m.content?.trim() === repeatedContent)
          .slice(0, 3)
          .map(m => ({
            id: m.id,
            content: m.content?.substring(0, 50),
            created_at: m.created_at
          }))
      }
    };
  }

  detectSimilarity(messages) {
    const similarPairs = [];

    for (let i = 0; i < messages.length; i++) {
      for (let j = i + 1; j < Math.min(i + 10, messages.length); j++) {
        const sim = this.calculateSimilarity(
          messages[i].content || '',
          messages[j].content || ''
        );
        if (sim >= AUDIT_CONFIG.similarityThreshold) {
          similarPairs.push({ i, j, similarity: sim });
        }
      }
    }

    if (similarPairs.length < 3) return null;

    return {
      type: 'similarity',
      score: AUDIT_CONFIG.scoreThresholds.similarity + Math.floor(similarPairs.length / 2),
      severity: similarPairs.length > 8 ? 'high' : 'medium',
      details: {
        similarPairs: similarPairs.length,
        evidence: similarPairs.slice(0, 3).map(pair => ({
          id1: messages[pair.i].id,
          id2: messages[pair.j].id,
          content1: messages[pair.i].content?.substring(0, 50),
          similarity: Math.round(pair.similarity * 100) + '%'
        }))
      }
    };
  }

  detectLongContent(messages) {
    const longMessages = messages.filter(m => (m.content?.length || 0) > 1000);
    if (longMessages.length === 0) return null;

    const maxLength = Math.max(...longMessages.map(m => m.content?.length || 0));
    const avgLength = longMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / longMessages.length;

    return {
      type: 'longContent',
      score: AUDIT_CONFIG.scoreThresholds.longContent + Math.floor(maxLength / 500),
      severity: maxLength > 3000 ? 'high' : 'medium',
      details: {
        count: longMessages.length,
        avgLength: Math.round(avgLength),
        maxLength,
        evidence: longMessages.slice(0, 2).map(m => ({
          id: m.id,
          length: m.content?.length,
          preview: m.content?.substring(0, 80)
        }))
      }
    };
  }

  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;

    const s1Words = str1.split(/\s+/).slice(0, 15);
    const s2Words = str2.split(/\s+/).slice(0, 15);
    const intersection = s1Words.filter(w => s2Words.includes(w)).length;
    const union = new Set([...s1Words, ...s2Words]).size;

    return union > 0 ? intersection / union : 0;
  }

  async submitIssue(userId, conversationId, issue, messages) {
    const severityMap = { critical: 'critical', high: 'high', medium: 'medium', low: 'low' };
    const severity = severityMap[issue.severity] || 'medium';

    const contentPreview = issue.details.evidence?.[0]?.content ||
                           issue.details.evidence?.[0]?.preview || '';
    const fullContent = messages.slice(0, 50).map(m => m.content).join('\n').substring(0, 5000);

    const metadata = {
      conversationId,
      issueType: issue.type,
      messageCount: messages.length,
      ...issue.details
    };

    const aiAnalysis = `${issue.type}: ${issue.details.messageCount || issue.details.repeatCount || issue.details.similarPairs || issue.details.maxLength || 0}`;

    try {
      await antiSpamService.saveAIFeedback(
        issue.type === 'longContent' ? 'malicious' : issue.type,
        severity,
        parseInt(userId),
        'conversation',
        conversationId,
        contentPreview,
        fullContent,
        metadata,
        issue.score,
        aiAnalysis
      );
      return true;
    } catch (err) {
      console.error('[AuditQueue] 提交问题失败:', err);
      return false;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus() {
    return {
      pending: this.pendingTasks.size,
      processing: this.processingTasks.size,
      completed: this.completedTasks.size,
      workers: this.workerPool.length
    };
  }
}

export const messageAuditor = new AuditTaskQueue();
export default messageAuditor;