import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import config from './config/index.js';
import { testConnection, closePool } from './utils/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { initWebSocket } from './utils/websocket.js';
import { rateLimitMiddleware, globalRateLimitMiddleware, getRateLimitStats } from './middleware/rateLimiter.js';

import userRoutes from './routes/user.js';
import conversationRoutes from './routes/conversation.js';
import messageRoutes from './routes/message.js';
import contactRoutes from './routes/contact.js';
import momentsRoutes from './routes/moments.js';
import settingsRoutes from './routes/settings.js';
import adminRoutes from './routes/admin.js';
import tempConversationRoutes from './routes/tempConversation.js';
import uploadRoutes from './routes/upload.js';
import hiddenRoutes from './routes/hidden.js';
import aiRoutes from './routes/ai.js';
import proxyRoutes from './routes/proxy.js';
import studioAdminRoutes from './routes/studioAdmin.js';
import systemNotificationRoutes from './routes/systemNotification.js';
import gameRoutes from './routes/game.js';

const app = express();

app.disable('etag');

const allowedOrigins = [
  'http://localhost:5173',
  'https://im.cdk.lat',
  'https://www.im.cdk.lat'
];

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma', 'Expires']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api', globalRateLimitMiddleware);
app.use('/api', rateLimitMiddleware);
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use('/api', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || !origin) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma, Expires');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(204).end();
    }
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ code: 200, data: { status: 'ok', timestamp: new Date().toISOString() }, msg: 'OK' });
});

app.get('/api/rate-limit/unblock', (req, res) => {
  const { unblockByIp } = require('./middleware/rateLimiter.js');
  const ip = req.ip || req.socket.remoteAddress || req.query.ip;
  const success = unblockByIp(ip);
  res.json({
    code: 200,
    data: { success, ip },
    msg: success ? 'Unblocked successfully' : 'IP not found or not blocked'
  });
});

app.get('/api/stats', (req, res) => {
  const rateLimitStats = getRateLimitStats ? getRateLimitStats() : {};
  res.json({
    code: 200,
    data: {
      rateLimit: rateLimitStats,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    },
    msg: 'OK'
  });
});

app.use('/api/user', userRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/moments', momentsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/temp-conversation', tempConversationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/v2', hiddenRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/studio/admin', studioAdminRoutes);
app.use('/api/system-notification', systemNotificationRoutes);
app.use('/api/game', gameRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = createServer(app);

initWebSocket(server);

async function startServer() {
  console.log('Testing database connection...');
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database. Please check your MySQL configuration.');
    console.error('Make sure MySQL is running and the credentials in .env are correct.');
    process.exit(1);
  }
  console.log('Database connection successful.');

  const { query } = await import('./utils/db.js');
  try {
    await query("ALTER TABLE message MODIFY COLUMN type ENUM('text', 'image', 'file', 'system', 'recalled', 'game_invite') DEFAULT 'text'");
    console.log('[Migration] message.type ENUM updated: added recalled + game_invite');
  } catch (err) {
    console.log('[Migration] message.type already has recalled or migration failed:', err.message?.substring(0, 80));
  }

  // TiDB兼容: 将 conversation.type 从 ENUM 改为 VARCHAR (ENUM修改在TiDB中不可靠)
  try {
    await query("ALTER TABLE conversation MODIFY COLUMN type VARCHAR(20) DEFAULT 'single'");
    console.log('[Migration] conversation.type converted to VARCHAR (TiDB compatible)');
  } catch (err) {
    console.log('[Migration] conversation.type conversion failed (may already be VARCHAR):', err.message?.substring(0, 80));
  }

  try {
    await query(`CREATE TABLE IF NOT EXISTS system_notification (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      type VARCHAR(20) DEFAULT 'info',
      icon VARCHAR(500) DEFAULT NULL,
      is_active TINYINT DEFAULT 1,
      created_by INT DEFAULT NULL,
      image_url VARCHAR(500) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    console.log('[Migration] system_notification table ready');
  } catch (err) {
    console.log('[Migration] system_notification table check failed:', err.message?.substring(0, 80));
  }

  // 确保message_read表存在（世界频道未读计数依赖此表）
  try {
    await query(`CREATE TABLE IF NOT EXISTS message_read (
      id INT PRIMARY KEY AUTO_INCREMENT,
      conversation_id INT NOT NULL,
      user_id INT NOT NULL,
      seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_conversation_user (conversation_id, user_id),
      INDEX idx_conversation_id (conversation_id),
      INDEX idx_user_id (user_id),
      FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('[Migration] message_read table ready');
  } catch (err) {
    console.log('[Migration] message_read table check failed:', err.message?.substring(0, 80));
  }

  // 确保conversation_member表存在（世界频道成员管理依赖此表）
  try {
    await query(`CREATE TABLE IF NOT EXISTS conversation_member (
      id INT PRIMARY KEY AUTO_INCREMENT,
      conversation_id INT NOT NULL,
      user_id INT NOT NULL,
      role ENUM('owner', 'admin', 'member') DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_conversation_id (conversation_id),
      INDEX idx_user_id (user_id),
      FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('[Migration] conversation_member table ready');
  } catch (err) {
    console.log('[Migration] conversation_member table check failed:', err.message?.substring(0, 80));
  }

  // 自动创建世界频道
  try {
    const [existing] = await query("SELECT id FROM conversation WHERE type = 'world' LIMIT 1");
    if (!existing) {
      await query("INSERT INTO conversation (type, name, created_at) VALUES ('world', '世界频道', NOW())");
      console.log('[Migration] World channel created');
    }
  } catch (err) {
    console.log('[Migration] World channel check failed:', err.message?.substring(0, 80));
  }

  // 自动创建系统通知会话
  try {
    const [notifConv] = await query("SELECT id FROM conversation WHERE type = 'notification' LIMIT 1");
    if (!notifConv) {
      await query("INSERT INTO conversation (type, name, created_at) VALUES ('notification', '系统通知', NOW())");
      console.log('[Migration] Notification conversation created');
    }
  } catch (err) {
    console.log('[Migration] Notification conversation check failed:', err.message?.substring(0, 80));
  }

  // 游戏功能表
  try {
    await query(`CREATE TABLE IF NOT EXISTS game_match (
      id INT PRIMARY KEY AUTO_INCREMENT,
      game_type ENUM('gomoku','tictactoe','chess') NOT NULL,
      mode ENUM('ai','pvp') NOT NULL DEFAULT 'ai',
      player1_id INT NOT NULL,
      player2_id INT DEFAULT NULL,
      winner_id INT DEFAULT NULL,
      status ENUM('pending','playing','finished','abandoned') NOT NULL DEFAULT 'pending',
      ai_difficulty ENUM('easy','medium','hard') DEFAULT 'medium',
      moves JSON DEFAULT NULL,
      duration_seconds INT DEFAULT NULL,
      score_change INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      finished_at TIMESTAMP DEFAULT NULL,
      INDEX idx_player1 (player1_id),
      INDEX idx_player2 (player2_id),
      INDEX idx_status (status),
      INDEX idx_game_type (game_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('[Migration] game_match table ready');
  } catch (err) {
    console.log('[Migration] game_match table check failed:', err.message?.substring(0, 80));
  }

  try {
    await query(`CREATE TABLE IF NOT EXISTS user_game_profile (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT UNIQUE NOT NULL,
      total_games INT DEFAULT 0,
      wins INT DEFAULT 0,
      losses INT DEFAULT 0,
      draws INT DEFAULT 0,
      rating INT DEFAULT 1000,
      peak_rating INT DEFAULT 1000,
      rank_tier VARCHAR(20) DEFAULT 'iron',
      gomoku_wins INT DEFAULT 0,
      gomoku_losses INT DEFAULT 0,
      tictactoe_wins INT DEFAULT 0,
      tictactoe_losses INT DEFAULT 0,
      chess_wins INT DEFAULT 0,
      chess_losses INT DEFAULT 0,
      current_win_streak INT DEFAULT 0,
      best_win_streak INT DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_rating (rating)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('[Migration] user_game_profile table ready');
  } catch (err) {
    console.log('[Migration] user_game_profile table check failed:', err.message?.substring(0, 80));
  }

  // 围棋模式支持迁移
  try {
    await query(`ALTER TABLE game_match MODIFY COLUMN game_type ENUM('gomoku','tictactoe','chess','go') NOT NULL`);
    console.log('[Migration] game_match.game_type ENUM updated with go');
  } catch (err) {
    console.log('[Migration] game_match game_type migration:', err.message?.substring(0, 80));
  }

  try {
    await query(`ALTER TABLE user_game_profile ADD COLUMN go_wins INT DEFAULT 0`);
    console.log('[Migration] user_game_profile.go_wins added');
  } catch (err) {
    console.log('[Migration] user_game_profile.go_wins already exists or error:', err.message?.substring(0, 80));
  }

  try {
    await query(`ALTER TABLE user_game_profile ADD COLUMN go_losses INT DEFAULT 0`);
    console.log('[Migration] user_game_profile.go_losses added');
  } catch (err) {
    console.log('[Migration] user_game_profile.go_losses already exists or error:', err.message?.substring(0, 80));
  }

  try {
    const { runMigrations } = await import('./migrations/performanceMigration.js');
    await runMigrations();
  } catch (err) {
    console.log('[Migration] Performance fields migration check:', err.message?.substring(0, 80));
  }

  // 添加 last_seen 字段用于心跳在线检测
  try {
    await query("ALTER TABLE user ADD COLUMN last_seen TIMESTAMP NULL DEFAULT NULL");
    console.log('[Migration] user.last_seen column added');
  } catch (err) {
    console.log('[Migration] user.last_seen column may already exist:', err.message?.substring(0, 80));
  }

  // 心跳离线清理定时器：每30秒检查，超过45秒无心跳的用户标记为离线
  setInterval(async () => {
    try {
      const result = await query("UPDATE user SET status = 0 WHERE status = 1 AND (last_seen IS NULL OR last_seen < DATE_SUB(NOW(), INTERVAL 45 SECOND))");
      if (result.affectedRows > 0) {
        console.log(`[HeartbeatCleanup] Marked ${result.affectedRows} users offline`);
      }
    } catch (err) {
      console.error('[HeartbeatCleanup] Failed:', err.message);
    }
  }, 30000);
  console.log('[Heartbeat] Cleanup timer started (45s threshold, 30s interval)');

  // 游戏对局逃跑检测定时器：每20秒检查，超过45秒无心跳的对局自动判负
  try {
    await query("ALTER TABLE game_match ADD COLUMN last_heartbeat TIMESTAMP NULL DEFAULT NULL");
    console.log('[Migration] game_match.last_heartbeat column added');
  } catch (err) {
    console.log('[Migration] game_match.last_heartbeat may already exist:', err.message?.substring(0, 80));
  }

  try {
    await query("ALTER TABLE game_match MODIFY COLUMN status ENUM('pending','playing','finished','abandoned') NOT NULL DEFAULT 'pending'");
    console.log('[Migration] game_match.status ENUM updated (added pending)');
  } catch (err) {
    console.log('[Migration] game_match.status ENUM update may not be needed:', err.message?.substring(0, 80));
  }

  const { GameService: GameMonitorService } = await import('./services/GameService.js');
  setInterval(async () => {
    try {
      const count = await GameMonitorService.finishAbandonedMatches();
      if (count > 0) {
        console.log(`[GameMonitor] 处理了 ${count} 个逃跑对局`);
      }
    } catch (err) {
      console.error('[GameMonitor] 检查失败:', err.message);
    }
  }, 20000);
  console.log('[GameMonitor] Abandoned match detector started (45s threshold, 20s interval)');

  server.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(`WebSocket running on ws://localhost:${config.port}/ws`);
    console.log(`API available at http://localhost:${config.port}/api`);
  });
}

async function gracefulShutdown() {
  console.log('\nShutting down gracefully...');
  closePool();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
