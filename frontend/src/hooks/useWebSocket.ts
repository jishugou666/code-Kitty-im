import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

const WS_URL = import.meta.env.VITE_WS_URL;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { token, isAuthenticated } = useAuthStore();
  const { conversations, addMessage, fetchConversations } = useChatStore();

  const connect = useCallback(() => {
    if (!token || !isAuthenticated) return;

    try {
      const ws = new WebSocket(`${WS_URL}?token=${token}`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        wsRef.current = null;
        if (isAuthenticated) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }, [token, isAuthenticated]);

  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'connected':
        console.log('WebSocket authenticated:', message.userId);
        break;

      case 'new_message':
        if (message.data) {
          addMessage(message.data.conversation_id, message.data);
          fetchConversations();
        }
        break;

      case 'user_typing':
        console.log('User typing:', message.data);
        break;

      case 'messages_read':
        console.log('Messages read:', message.data);
        fetchConversations();
        break;

      case 'user_status':
        console.log('User status changed:', message.data);
        fetchConversations();
        break;
    }
  }, [addMessage, fetchConversations]);

  const sendMessage = useCallback((data: { type: string; data: any }) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  }, []);

  const sendChatMessage = useCallback((conversationId: number, content: string) => {
    sendMessage({
      type: 'chat',
      data: { conversationId, content }
    });
  }, [sendMessage]);

  const sendTyping = useCallback((conversationId: number) => {
    sendMessage({
      type: 'typing',
      data: { conversationId }
    });
  }, [sendMessage]);

  const sendRead = useCallback((conversationId: number) => {
    sendMessage({
      type: 'read',
      data: { conversationId }
    });
  }, [sendMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    sendMessage,
    sendChatMessage,
    sendTyping,
    sendRead,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  };
}
