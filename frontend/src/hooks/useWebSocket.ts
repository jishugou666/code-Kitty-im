import { useEffect, useRef, useCallback } from 'react';
import Pusher from 'pusher-js';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY || 'c83b4566e58d78c1dd50';
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'ap1';

let globalPusher: Pusher | null = null;

export function getPusher(): Pusher {
  if (!globalPusher) {
    globalPusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER
    });
  }
  return globalPusher;
}

export function useWebSocket(conversationId?: number) {
  const channelRef = useRef<ReturnType<Pusher['subscribe']> | null>(null);
  const { token, isAuthenticated, user } = useAuthStore();
  const { addMessage, fetchConversations } = useChatStore();

  const handleNewMessage = useCallback((data: any) => {
    console.log('[Pusher] New message received:', data);
    if (data && data.id) {
      addMessage(data.conversation_id, data);
      fetchConversations();
    }
  }, [addMessage, fetchConversations]);

  const handleMessageRead = useCallback((data: any) => {
    console.log('[Pusher] Message read:', data);
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const pusher = getPusher();

    if (conversationId) {
      const channelName = `chat-${conversationId}`;
      console.log(`[Pusher] Subscribing to channel: ${channelName}`);

      channelRef.current = pusher.subscribe(channelName);

      channelRef.current.bind('new-message', handleNewMessage);
      channelRef.current.bind('message-read', handleMessageRead);

      return () => {
        if (channelRef.current) {
          channelRef.current.unbind('new-message', handleNewMessage);
          channelRef.current.unbind('message-read', handleMessageRead);
          pusher.unsubscribe(channelName);
          channelRef.current = null;
        }
      };
    }
  }, [isAuthenticated, token, conversationId, user?.id, handleNewMessage, handleMessageRead]);

  return {
    isConnected: true
  };
}

export function useGlobalWebSocket() {
  const { isAuthenticated, token } = useAuthStore();
  const { fetchConversations } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const pusher = getPusher();

    const userChannel = pusher.subscribe(`user-${user?.id}`);

    userChannel.bind('conversation-update', (data: any) => {
      console.log('[Pusher] Conversation update:', data);
      fetchConversations();
    });

    return () => {
      pusher.unsubscribe(`user-${user?.id}`);
    };
  }, [isAuthenticated, token, user?.id, fetchConversations]);
}