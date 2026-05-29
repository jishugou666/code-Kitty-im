import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { messageEventBus } from '../lib/messageEventBus';
import type { PusherMessageEvent, PusherMessageRecallEvent, MessageEventHandler } from '../types';

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

export function useWebSocket(conversationId?: number, onNewMessage?: MessageEventHandler) {
  const channelRef = useRef<ReturnType<Pusher['subscribe']> | null>(null);
  const { token, isAuthenticated } = useAuthStore();
  const { addMessage, fetchMessages } = useChatStore();
  const onNewMessageRef = useRef(onNewMessage);
  const addMessageRef = useRef(addMessage);
  const fetchMessagesRef = useRef(fetchMessages);
  onNewMessageRef.current = onNewMessage;
  addMessageRef.current = addMessage;
  fetchMessagesRef.current = fetchMessages;

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const pusher = getPusher();

    if (conversationId) {
      const channelName = `chat-${conversationId}`;

      channelRef.current = pusher.subscribe(channelName);

      const handleNewMessage = (data: PusherMessageEvent) => {
        if (data && data.id) {
          addMessageRef.current(data.conversation_id, data);
        }
        onNewMessageRef.current?.(data);
      };

      const handleMessageRecalled = (data: PusherMessageRecallEvent) => {
        if (data && data.messageId) {
          fetchMessagesRef.current(data.conversationId);
        }
      };

      const handleMessageUpdated = (data: PusherMessageEvent) => {
        onNewMessageRef.current?.(data);
      };

      channelRef.current.bind('new-message', handleNewMessage);
      channelRef.current.bind('message-read', () => {});
      channelRef.current.bind('message-recalled', handleMessageRecalled);
      channelRef.current.bind('game-invite-updated', handleMessageUpdated);

      return () => {
        if (channelRef.current) {
          channelRef.current.unbind('new-message', handleNewMessage);
          channelRef.current.unbind('message-read', () => {});
          channelRef.current.unbind('message-recalled', handleMessageRecalled);
          channelRef.current.unbind('game-invite-updated', handleMessageUpdated);
          pusher.unsubscribe(channelName);
          channelRef.current = null;
        }
      };
    }
  }, [isAuthenticated, token, conversationId]);

  return {
    isConnected: true
  };
}

export function useGlobalWebSocket() {
  const { isAuthenticated, token, user } = useAuthStore();
  const { fetchConversations } = useChatStore();
  const userChannelRef = useRef<ReturnType<Pusher['subscribe']> | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const pusher = getPusher();
    const currentUserId = user?.id;

    if (currentUserId) {
      userChannelRef.current = pusher.subscribe(`user-${currentUserId}`);

      const fetchConversationsRef = { current: fetchConversations };
      const handleConversationUpdate = () => {
        fetchConversationsRef.current();
      };

      const handleGlobalNewMessage = (data: PusherMessageEvent) => {
        console.log('[GlobalWebSocket] 📨 Received new-message on user channel:', data?.id, data?.sender_nickname);
        messageEventBus.emit(data);
      };

      userChannelRef.current.bind('conversation-update', handleConversationUpdate);
      userChannelRef.current.bind('new-message', handleGlobalNewMessage);

      return () => {
        if (userChannelRef.current) {
          userChannelRef.current.unbind('conversation-update', handleConversationUpdate);
          userChannelRef.current.unbind('new-message', handleGlobalNewMessage);
          pusher.unsubscribe(`user-${currentUserId}`);
          userChannelRef.current = null;
        }
      };
    }
  }, [isAuthenticated, token, user?.id, fetchConversations]);
}
