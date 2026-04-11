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
import groupRoutes from './routes/group.js';
import uploadRoutes from './routes/upload.js';
import hiddenRoutes from './routes/hidden.js';
import aiRoutes from './routes/ai.js';

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
app.use('/api/group', groupRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/v2', hiddenRoutes);

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
