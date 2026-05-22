import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../store/authStore';

interface SystemNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

const NOTIFICATION_REQUESTED_KEY = 'im_notification_requested';

function getCurrentChatId(): string | null {
  const match = window.location.pathname.match(/^\/chat\/(\d+)/);
  return match ? match[1] : null;
}

export function useSystemNotification(autoRequest = true) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const hasAutoRequested = useRef(false);

  useEffect(() => {
    const supported = 'Notification' in window;
    setIsSupported(supported);
    if (supported) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!isSupported || !autoRequest || hasAutoRequested.current) return;

    const currentPermission = Notification.permission;
    if (currentPermission === 'granted') {
      setPermissionStatus('granted');
      return;
    }
    if (currentPermission === 'denied') {
      setPermissionStatus('denied');
      return;
    }

    const requested = localStorage.getItem(NOTIFICATION_REQUESTED_KEY);
    if (requested) return;

    hasAutoRequested.current = true;
    localStorage.setItem(NOTIFICATION_REQUESTED_KEY, '1');

    const timer = setTimeout(async () => {
      try {
        console.log('[SystemNotification] Requesting notification permission...');
        const permission = await Notification.requestPermission();
        console.log('[SystemNotification] Permission result:', permission);
        setPermissionStatus(permission);
      } catch (err) {
        console.error('[SystemNotification] Permission request failed:', err);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isSupported, autoRequest]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    try {
      console.log('[SystemNotification] Manual permission request...');
      const permission = await Notification.requestPermission();
      console.log('[SystemNotification] Manual permission result:', permission);
      setPermissionStatus(permission);
      return permission === 'granted';
    } catch {
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((options: SystemNotificationOptions) => {
    const livePermission = Notification.permission;
    console.log('[SystemNotification] showNotification called:', {
      title: options.title,
      isSupported,
      livePermission,
      permissionStatus,
    });

    if (!isSupported) {
      console.warn('[SystemNotification] Blocked: Not supported');
      return;
    }

    if (livePermission !== 'granted') {
      console.warn('[SystemNotification] Blocked: Permission not granted:', livePermission);
      setPermissionStatus(livePermission);
      return;
    }

    console.log('[SystemNotification] Creating notification...');

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || undefined,
        tag: options.tag,
        requireInteraction: false,
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        options.onClick?.();
        notification.close();
      };

      setTimeout(() => notification.close(), 8000);

      console.log('[SystemNotification] ✅ Notification created successfully');
    } catch (err) {
      console.error('[SystemNotification] Failed to create notification:', err);
    }
  }, [isSupported, permissionStatus]);

  const notifyNewMessage = useCallback((message: any) => {
    console.log('[SystemNotification] notifyNewMessage called:', {
      messageId: message?.id,
      senderId: message?.sender_id,
      myId: user?.id,
      conversationId: message?.conversation_id,
      type: message?.type,
    });

    if (!message) {
      console.warn('[SystemNotification] Blocked: No message');
      return;
    }

    if (message.sender_id === user?.id) {
      console.log('[SystemNotification] Blocked: Own message');
      return;
    }

    const msgConversationId = String(message.conversation_id);
    const viewingChatId = getCurrentChatId();
    const isViewingThisChat = viewingChatId === msgConversationId;

    console.log('[SystemNotification] Chat check:', {
      msgConversationId,
      viewingChatId,
      isViewingThisChat,
      pathname: window.location.pathname,
    });

    if (isViewingThisChat) {
      console.log('[SystemNotification] Blocked: User is viewing this chat');
      return;
    }

    const senderName = message.sender_nickname || 'Unknown';
    let previewBody = '';
    if (message.type === 'text') {
      previewBody = message.content?.substring(0, 60) || '发来一条消息';
      if (message.content?.length > 60) previewBody += '...';
    } else if (message.type === 'image') {
      previewBody = '[图片]';
    } else if (message.type === 'file') {
      previewBody = '[文件]';
    } else {
      previewBody = '发来一条消息';
    }

    showNotification({
      title: `${senderName}`,
      body: previewBody,
      icon: message.sender_avatar || undefined,
      tag: `msg-${message.id}`,
      onClick: () => {
        if (message.conversation_id) {
          navigate(`/chat/${message.conversation_id}`);
        }
      },
    });
  }, [user?.id, showNotification, navigate]);

  return {
    isSupported,
    permissionStatus,
    requestPermission,
    showNotification,
    notifyNewMessage,
  };
}
