import { useEffect, useRef, useCallback } from 'react';
import Pusher from 'pusher-js';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useContactStore } from '../store/contactStore';
import { userApi } from '../api/user';

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'ap1';

let globalPusher: Pusher | null = null;

export function getPusher(): Pusher {
  if (!globalPusher) {
    if (!PUSHER_KEY) {
      console.error('Pusher key is not configured. Set VITE_PUSHER_KEY environment variable.');
    }
    globalPusher = new Pusher(PUSHER_KEY || 'demo-key', {
      cluster: PUSHER_CLUSTER
    });
  }
  return globalPusher;
}

export function useWebSocket(conversationId?: number, onNewMessage?: (msg: any) => void) {
  const channelRef = useRef<ReturnType<Pusher['subscribe']> | null>(null);
  const { token, isAuthenticated, user } = useAuthStore();
  const { addMessage, fetchConversations, fetchMessages } = useChatStore();

  const handleVisibilityChange = useCallback(() => {
    if (!isAuthenticated) return;
    const isOnline = document.visibilityState === 'visible';
    userApi.updateStatus(isOnline ? 1 : 0);
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated) return;

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, handleVisibilityChange]);

  const handleNewMessage = useCallback((data: any) => {
    if (data && data.id) {
      addMessage(data.conversation_id, data);
    }
  }, [addMessage]);

  const handleMessageRead = useCallback((data: any) => {
    if (data && data.conversationId) {
      const { setReadStatus } = useChatStore.getState();
      setReadStatus(data.conversationId, new Date().toISOString());
    }
  }, []);

  const handleMessageRecalled = useCallback((data: any) => {
    if (data && data.messageId) {
      fetchMessages(data.conversationId);
    }
  }, [fetchMessages]);

  const handleUserStatusChange = useCallback((data: any) => {
    if (data && data.userId && data.status !== undefined) {
      const { updateUserStatus } = useContactStore.getState();
      updateUserStatus(data.userId, data.status);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const pusher = getPusher();

    if (conversationId) {
      const channelName = `chat-${conversationId}`;

      channelRef.current = pusher.subscribe(channelName);

      channelRef.current.bind('new-message', handleNewMessage);
      channelRef.current.bind('message-read', handleMessageRead);
      channelRef.current.bind('message-recalled', handleMessageRecalled);

      return () => {
        if (channelRef.current) {
          channelRef.current.unbind('new-message', handleNewMessage);
          channelRef.current.unbind('message-read', handleMessageRead);
          channelRef.current.unbind('message-recalled', handleMessageRecalled);
          pusher.unsubscribe(channelName);
          channelRef.current = null;
        }
      };
    }
  }, [isAuthenticated, token, conversationId, user?.id, handleNewMessage, handleMessageRead, handleMessageRecalled]);

  return {
    isConnected: true
  };
}

export function useGlobalWebSocket() {
  const { isAuthenticated, token, user } = useAuthStore();
  const { fetchConversations } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const pusher = getPusher();

    const userChannel = pusher.subscribe(`user-${user?.id}`);

    userChannel.bind('conversation-update', (data: any) => {
      fetchConversations();
    });

    userChannel.bind('user-status-change', handleUserStatusChange);

    return () => {
      userChannel.unbind('user-status-change', handleUserStatusChange);
      pusher.unsubscribe(`user-${user?.id}`);
    };
  }, [isAuthenticated, token, user?.id, fetchConversations, handleUserStatusChange]);
}