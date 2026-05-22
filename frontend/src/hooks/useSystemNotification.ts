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

export function useSystemNotification() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = 'Notification' in window;
    setIsSupported(supported);
    if (supported) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      return permission === 'granted';
    } catch {
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((options: SystemNotificationOptions) => {
    if (!isSupported || permissionStatus !== 'granted') return;

    if (document.visibilityState === 'visible') return;

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
  }, [isSupported, permissionStatus]);

  const notifyNewMessage = useCallback((message: any) => {
    if (!message || message.sender_id === user?.id) return;

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
