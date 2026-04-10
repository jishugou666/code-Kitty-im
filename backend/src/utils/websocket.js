import { WebSocketServer } from 'ws';
import { verifyToken } from './crypto.js';
import { query } from './db.js';
import config from '../config/index.js';

const clients = new Map();
const adminClients = new Set();

let wss = null;

export function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      const isAdminChannel = url.searchParams.get('channel') === 'admin';

      if (!token) {
        ws.close(4001, 'No token provided');
        return;
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        ws.close(4002, 'Invalid token');
        return;
      }

      const userId = decoded.id;
      const role = decoded.role;

      clients.set(userId, ws);
      ws.userId = userId;
      ws.isAdmin = role === 'admin';

      if (ws.isAdmin && isAdminChannel) {
        adminClients.add(userId);
      }

      await query('UPDATE user SET status = 1 WHERE id = ?', [userId]);

      broadcastUserStatus(userId, 'online');

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          handleMessage(userId, message);
        } catch (err) {
          console.error('WebSocket message error:', err);
        }
      });

      ws.on('close', async () => {
        clients.delete(userId);
        adminClients.delete(userId);
        await query('UPDATE user SET status = 0 WHERE id = ?', [userId]);
        broadcastUserStatus(userId, 'offline');
      });

      ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        clients.delete(userId);
        adminClients.delete(userId);
      });

      ws.send(JSON.stringify({ type: 'connected', userId }));
    } catch (err) {
      console.error('WebSocket connection error:', err);
      ws.close(4000, 'Connection error');
    }
  });

  return wss;
}

async function handleMessage(userId, message) {
  const { type, data } = message;

  switch (type) {
    case 'chat':
      if (data.conversationId && data.content) {
        const result = await query(
          'INSERT INTO message (conversation_id, sender_id, content, type) VALUES (?, ?, ?, ?)',
          [data.conversationId, userId, data.content, data.type || 'text']
        );

        const messages = await query(
          `SELECT m.*, u.username, u.nickname, u.avatar
           FROM message m
           JOIN user u ON m.sender_id = u.id
           WHERE m.id = ?`,
          [result.insertId]
        );

        const newMessage = messages[0];
        broadcastToConversation(data.conversationId, {
          type: 'new_message',
          data: newMessage
        });
      }
      break;

    case 'typing':
      if (data.conversationId) {
        broadcastToConversation(data.conversationId, {
          type: 'user_typing',
          data: { userId, conversationId: data.conversationId }
        }, userId);
      }
      break;

    case 'read':
      if (data.conversationId) {
        broadcastToConversation(data.conversationId, {
          type: 'messages_read',
          data: { userId, conversationId: data.conversationId }
        });
      }
      break;

    case 'subscribe_ai_status':
      if (clients.get(userId)?.isAdmin) {
        adminClients.add(userId);
        ws.send(JSON.stringify({ type: 'ai_status_subscribed' }));
      }
      break;
  }
}

function broadcastToConversation(conversationId, message, excludeUserId = null) {
  clients.forEach((ws, uid) => {
    if (uid !== excludeUserId && ws.readyState === 1) {
      ws.send(JSON.stringify(message));
    }
  });
}

function broadcastUserStatus(userId, status) {
  const statusMessage = JSON.stringify({ type: 'user_status', data: { userId, status } });
  clients.forEach((ws) => {
    if (ws.readyState === 1) {
      ws.send(statusMessage);
    }
  });
}

export function broadcastToAdmins(message) {
  const msgStr = JSON.stringify(message);
  adminClients.forEach((userId) => {
    const ws = clients.get(userId);
    if (ws && ws.readyState === 1) {
      ws.send(msgStr);
    }
  });
}

export function sendToUser(userId, message) {
  const ws = clients.get(userId);
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(message));
    return true;
  }
  return false;
}

export function closeWebSocket() {
  if (wss) {
    wss.close();
    wss = null;
  }
  clients.clear();
  adminClients.clear();
}