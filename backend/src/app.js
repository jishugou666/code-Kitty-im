import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import config from './config/index.js';
import { testConnection, closePool } from './utils/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { initWebSocket } from './utils/websocket.js';

import userRoutes from './routes/user.js';
import conversationRoutes from './routes/conversation.js';
import messageRoutes from './routes/message.js';
import contactRoutes from './routes/contact.js';

const app = express();

app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ code: 200, data: { status: 'ok', timestamp: new Date().toISOString() }, msg: 'OK' });
});

app.use('/api/user', userRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/contact', contactRoutes);

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
