import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Plus, Send, Image, File, X, AlertTriangle, ShieldAlert, Megaphone, CheckCircle, Info, Gamepad2, ChevronRight, CheckCircle2, XCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import React from "react";
import { clsx } from "clsx";
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { useWebSocket } from '../../hooks/useWebSocket';
import { messageEventBus } from '../../lib/messageEventBus';
import { tempConversationApi } from '../../api/tempConversation';
import { messageApi } from '../../api/message';
import { uploadApi } from '../../api/upload';
import { conversationApi } from '../../api/conversation';
import { gameApi } from '../../api/game';
import { useIsMobile } from '../components/ui/use-mobile';
import { getAvatarUrl } from '../../lib/avatarCache';
import { ImageWithLazyLoad } from '../components/ui/ImageWithLazyLoad';
import { VirtualMessageList } from '../components/VirtualMessageList';
import type { Message, Conversation, ConversationMember, AppError } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface MessageItemProps {
  message: any;
  isOwnMessage: boolean;
  isRecalled: boolean;
  isMobile: boolean;
  userId?: number | null;
  onShowMenu: (message: any) => void;
  onRespondGameInvite: (matchId: number, accepted: boolean, gameType?: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const MessageItem = React.memo(({
  message,
  isOwnMessage,
  isRecalled,
  isMobile,
  userId,
  onShowMenu,
  onRespondGameInvite,
  t
}: MessageItemProps) => {
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isOwnMessage && !isRecalled) {
      onShowMenu(message);
    }
  }, [isOwnMessage, isRecalled, message, onShowMenu]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isMobile && isOwnMessage && !isRecalled) {
      const start = Date.now();
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const check = setTimeout(() => {
        if (Date.now() - start > 500) {
          onShowMenu(message);
        }
      }, 500);
      const up = () => {
        clearTimeout(check);
        document.removeEventListener('touchend', up);
        document.removeEventListener('touchmove', move);
      };
      const move = (me: TouchEvent) => {
        const dx = Math.abs(me.touches[0].clientX - touchX);
        const dy = Math.abs(me.touches[0].clientY - touchY);
        if (dx > 10 || dy > 10) {
          clearTimeout(check);
        }
      };
      document.addEventListener('touchend', up);
      document.addEventListener('touchmove', move);
    }
  }, [isMobile, isOwnMessage, isRecalled, message, onShowMenu]);

  return (
    <div className={clsx("flex mb-3 gap-0", isOwnMessage ? "justify-end" : "justify-start")}>
      {!isOwnMessage && !isRecalled && (
        <div className={clsx(isMobile ? "w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center text-white text-[10px] sm:text-xs font-semibold mr-1.5 sm:mr-2 flex-shrink-0 overflow-hidden" : "w-8 h-8 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center text-white text-xs font-semibold mr-2 flex-shrink-0 overflow-hidden")}>
          {message.sender_avatar ? (
            <ImageWithLazyLoad src={getAvatarUrl(message.sender_avatar)} alt={message.sender_nickname || 'U'} className="w-full h-full object-cover" />
          ) : (
            (message.sender_nickname || 'U')[0]?.toUpperCase() || 'U'
          )}
        </div>
      )}
      <motion.div
        className={clsx(isMobile ? "max-w-[75%] sm:max-w-[70%] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 relative" : "max-w-[70%] rounded-2xl px-4 py-2 relative",
          isRecalled ? "bg-gray-200 dark:bg-gray-800 text-gray-500" :
          isOwnMessage ? "bg-[#007AFF] text-white" : "bg-white dark:bg-[#1A1D21] text-gray-900 dark:text-white"
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
      >
        {message.type === 'text' && <p className={clsx(isMobile ? "text-[13px] sm:text-sm" : "text-sm")}>{message.content}</p>}
        {message.type === 'image' && !isRecalled && <img src={message.content} alt={t('chat.image')} className={isMobile ? "rounded-lg max-w-[200px] sm:max-w-full" : "rounded-lg max-w-full"} />}
        {message.type === 'recalled' && (
          <p className={clsx(isMobile ? "text-[13px] sm:text-sm italic opacity-60" : "text-sm italic opacity-60")}>{message.content}</p>
        )}
        {message.type === 'file' && !isRecalled && (
          (() => {
            try {
              const fileData = JSON.parse(message.content || '{}');
              return (
                <div className="flex items-center gap-2">
                  <File size={isMobile ? 14 : 16} />
                  <span className={clsx(isMobile ? "text-[13px] sm:text-sm" : "text-sm")}>{fileData.name || t('chat.unknownFile')}</span>
                </div>
              );
            } catch { return <p className={clsx(isMobile ? "text-[13px] sm:text-sm" : "text-sm")}>{message.content}</p>; }
          })()
        )}
        {message.type === 'game_invite' && (() => {
          try {
            const inviteData = JSON.parse(message.content || '{}');
            const isPending = inviteData.status === 'pending';
            const isAccepted = inviteData.status === 'accepted';
            const isRejected = inviteData.status === 'rejected';
            const isSelfInvite = Number(inviteData.inviterId) === userId;
            const canRespond = isPending && !isSelfInvite;

            return (
              <div className="w-[260px] sm:w-[280px]">
                <div className={clsx(
                  "rounded-lg border overflow-hidden",
                  isAccepted ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20" :
                  isRejected ? "border-red-300 bg-red-50 dark:bg-red-900/20" :
                  "border-indigo-200 bg-gradient-to-b from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20"
                )}>
                  <div className={clsx(
                    "px-3 py-2 flex items-center gap-2",
                    isAccepted ? "bg-emerald-100 dark:bg-emerald-800/30" :
                    isRejected ? "bg-red-100 dark:bg-red-800/30" :
                    "bg-indigo-100 dark:bg-indigo-800/30"
                  )}>
                    <Gamepad2 size={16} className={clsx(
                      isAccepted ? "text-emerald-600" : isRejected ? "text-red-500" : "text-indigo-600"
                    )} />
                    <span className={clsx("text-xs font-semibold truncate",
                      isAccepted ? "text-emerald-700 dark:text-emerald-300" :
                      isRejected ? "text-red-700 dark:text-red-300" :
                      "text-indigo-700 dark:text-indigo-300"
                    )}>
                      {isAccepted ? t('game.gameStarted') : isRejected ? t('game.inviteRejected') : t('game.invite')}
                    </span>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                      {isSelfInvite
                        ? `${t('game.invite')} ${inviteData.gameName || inviteData.gameType}`
                        : `${inviteData.inviterName || t('game.opponent')} ${t('game.inviteDesc')} ${inviteData.gameName || inviteData.gameType}`
                      }
                    </p>
                    {canRespond && (
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => onRespondGameInvite(inviteData.matchId, true)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                        >
                          <CheckCircle2 size={12} /> {t('game.accept')}
                        </button>
                        <button
                          onClick={() => onRespondGameInvite(inviteData.matchId, false, inviteData.gameType)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 transition-colors"
                        >
                          <XCircle size={12} /> {t('game.reject')}
                        </button>
                      </div>
                    )}
                    {isAccepted && (
                      <button
                        onClick={() => window.location.href = `/games?matchId=${inviteData.matchId}&gameType=${inviteData.gameType}`}
                        className="w-full flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors mt-1"
                      >
                        <CheckCircle2 size={12} /> {t('game.enterGame')}
                      </button>
                    )}
                    {(isRejected || (!isPending && !isSelfInvite)) && (
                      <p className="text-[10px] text-gray-400 text-center mt-1">
                        {isRejected ? t('game.inviteRejected') : t('game.inviteAccepted')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          } catch {
            return <p className={clsx(isMobile ? "text-[13px] sm:text-sm" : "text-sm")}>[游戏邀请消息]</p>;
          }
        })()}
        <p className={clsx(isMobile ? "text-[9px] sm:text-[10px] mt-0.5" : "text-[10px] mt-1", isOwnMessage ? "text-white/60" : "text-gray-400", message.status === 'pending' && "flex items-center gap-1")}>
          {message.status === 'pending' && (
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {formatTime(message.created_at)}
        </p>
      </motion.div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

function formatLastSeen(lastSeen: string | null | undefined, t: (key: string, options?: Record<string, unknown>) => string): string {
  if (!lastSeen) return t('chat.offline');
  const now = Date.now();
  const time = new Date(lastSeen).getTime();
  const diff = now - time;
  if (diff < 60000) return t('chat.justOnline');
  if (diff < 3600000) return t('chat.minutesAgo', { count: Math.floor(diff / 60000) });
  if (diff < 86400000) return t('chat.hoursAgo', { count: Math.floor(diff / 3600000) });
  return t('chat.daysAgo', { count: Math.floor(diff / 86400000) });
}

export function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const conversationId = parseInt(id || '0');

  const GAME_TYPE_NAMES: Record<string, string> = {
    tictactoe: t('game.tictactoe'),
    gomoku: t('game.gomoku'),
    chess: t('game.chess')
  };

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [firstMessageId, setFirstMessageId] = useState<number | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isTempConversation, setIsTempConversation] = useState(false);
  const [showAntiFraudTip, setShowAntiFraudTip] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [messageMenuPos, setMessageMenuPos] = useState({ x: 0, y: 0 });
  const [isNotificationConv, setIsNotificationConv] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showGameInviteModal, setShowGameInviteModal] = useState(false);
  const [isInvitingGame, setIsInvitingGame] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, token } = useAuthStore();
  const { conversations, fetchConversations } = useChatStore();
  const { toast, ToastContainer } = useToast();
  const isMobile = useIsMobile();

  const conversation = conversations.find(c => c.id === conversationId);
  const otherUser = conversation?.members?.find((m: ConversationMember) => m.id !== user?.id);

  useWebSocket(conversationId || undefined, (newMessage) => {
    if (newMessage.type === 'recalled' || newMessage.type === 'message-recalled') {
      const recalledMessageId = newMessage.messageId || newMessage.id;
      setMessages(prev => prev.map(m =>
        m.id === recalledMessageId
          ? { ...m, type: 'recalled', content: t('chat.messageRecalled') }
          : m
      ));
    } else if (newMessage.type === 'message-deleted') {
      setMessages(prev => prev.filter(m => m.id !== newMessage.messageId));
    } else if (newMessage.type === 'messages-deleted') {
      setMessages(prev => prev.filter(m => m.sender_id !== newMessage.userId));
    } else if (newMessage.type === 'game-invite-updated') {
      setMessages(prev => prev.map(m =>
        m.id === newMessage.id
          ? { ...m, content: newMessage.content, type: 'game_invite' }
          : m
      ));
    } else {
      setMessages(prev => {
        if (prev.some(m => m.id === newMessage.id)) return prev;
        
        const isOwnMessage = newMessage.sender_id === user?.id;
        if (isOwnMessage) {
          const pendingIndex = prev.findIndex(
            m => m.status === 'pending' &&
                 m.sender_id === newMessage.sender_id &&
                 m.conversation_id === newMessage.conversation_id &&
                 m.content === newMessage.content &&
                 m.type === newMessage.type
          );
          if (pendingIndex >= 0) {
            const updated = [...prev];
            updated[pendingIndex] = { ...newMessage, status: 'sent' };
            return updated;
          }
        }
        
        messageEventBus.emit(newMessage);
        return [...prev, newMessage];
      });
    }
  });

  useEffect(() => {
    if (conversationId && token) {
      setMessages([]);
      if (conversation?.type === 'notification') {
        setIsNotificationConv(true);
        loadNotifications();
      } else {
        setIsNotificationConv(false);
        loadMessages();
      }
      markAsRead();
      setTimeout(() => checkTempConversation(), 1000);
    }
  }, [conversationId, token]);

  const loadNotifications = async () => {
    if (!conversationId || !token) return;
    setIsLoading(true);
    try {
      const res = await conversationApi.getNotificationChannel();
      if (res.code === 200 && res.data?.notifications) {
        setNotifications(res.data.notifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const checkTempConversation = async () => {
    if (!conversationId || !token) return;
    try {
      const result = await tempConversationApi.check(conversationId);
      setIsTempConversation(result.isTemp);
      if (result.isTemp) {
        setShowAntiFraudTip(true);
        setTimeout(() => setShowAntiFraudTip(false), 5000);
        const otherUser = conversation?.members?.find((m: ConversationMember) => m.id !== user?.id);
        if (otherUser) {
          await tempConversationApi.record(conversationId, otherUser.id);
        }
      }
    } catch (e) {
      console.error('检查临时会话失败:', e);
    }
  };

  const markAsRead = async () => {
    if (!conversationId || !token) return;
    try {
      await fetch(`${API_BASE_URL}/message/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ conversationId })
      });
      fetchConversations();
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const handleInviteGame = async (gameType: string) => {
    if (!otherUser?.id || !token) return;
    setIsInvitingGame(true);
    try {
      const res = await gameApi.sendGameInvite({
        opponentId: otherUser.id,
        gameType
      });
      if (res.code === 200) {
        setShowGameInviteModal(false);
        toast(`${t('game.inviteSent', { gameName: GAME_TYPE_NAMES[gameType] })} ${otherUser.nickname || otherUser.username || t('game.opponent')}`, 'success');
        setTimeout(() => loadMessages(), 500);
      } else {
        toast(res.msg || t('game.inviteFailed'), 'error');
      }
    } catch (error: AppError) {
      console.error('Invite game error:', error);
      toast(error.message || t('game.inviteFailed'), 'error');
    } finally {
      setIsInvitingGame(false);
    }
  };

  const handleRespondGameInvite = async (matchId: number, accepted: boolean, gameType?: string) => {
    if (!token) return;
    try {
      const { gameApi } = await import('../../api/game');
      const res = await gameApi.respondGameInvite({ matchId, accepted });
      if (res.code === 200 && accepted) {
        toast(t('game.acceptSuccess'), 'success');
        const actualGameType = gameType || res.data?.game_type || '';
        setTimeout(() => {
          window.location.href = `/games?matchId=${matchId}&gameType=${actualGameType}`;
        }, 600);
      } else if (res.code === 200) {
        setTimeout(() => loadMessages(), 500);
        toast(t('game.rejectedInvite'), 'info');
      }
    } catch (err: AppError) {
      toast(err.message || t('errors.defaultError'), 'error');
    }
  };

  const loadMessages = async () => {
    if (!conversationId || !token) {
      return;
    }
    setIsLoading(true);
    try {
      const res = await messageApi.getMessageList(conversationId, 30);

      if (res.code === 200 && Array.isArray(res.data)) {
        setMessages(res.data || []);
        setHasMore(res.hasMore || false);
        if (res.data.length > 0) {
          setFirstMessageId(res.data[0].id);
        } else {
          setFirstMessageId(null);
        }
      } else {
        console.error('消息加载失败:', res.msg);
        setMessages([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef(0);

  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || !token || !hasMore || isLoadingHistory) {
      return;
    }

    setIsLoadingHistory(true);
    try {
      const res = await messageApi.getMessageList(conversationId, 30, firstMessageId);

      if (res.code === 200 && Array.isArray(res.data)) {
        setMessages(prev => [...res.data, ...prev]);
        setHasMore(res.hasMore || false);
        if (res.data.length > 0) {
          setFirstMessageId(res.data[0].id);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load older messages:', error);
      setHasMore(false);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [conversationId, token, hasMore, isLoadingHistory, firstMessageId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop === 0 && hasMore && !isLoadingHistory) {
        prevScrollHeight.current = container.scrollHeight;
        loadOlderMessages();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingHistory, loadOlderMessages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container && prevScrollHeight.current > 0) {
      const newScrollHeight = container.scrollHeight;
      const diff = newScrollHeight - prevScrollHeight.current;
      container.scrollTop = diff;
      prevScrollHeight.current = 0;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId || !token) return;

    const text = input.trim();
    setInput("");

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage = {
      id: tempId,
      content: text,
      type: 'text',
      sender_id: user?.id,
      conversation_id: conversationId,
      created_at: new Date().toISOString(),
      status: 'pending'
    };

    setMessages(prev => [...(prev || []), optimisticMessage]);

    try {
      const response = await fetch(`${API_BASE_URL}/message/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId,
          content: text,
          type: 'text'
        })
      });
      const data = await response.json();

      if ((data.code === 200 || data.code === 201) && data.data) {
        setMessages(prev => prev.map(m => m.id === tempId ? data.data : m));
        fetchConversations();
      } else if (data.code === 429 && data.data?.blocked) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        toast(`⛔ ${data.data.details || t('chat.sendFailed')}`, 'warning');
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        toast(data.msg || t('chat.sendFailed'), 'error');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast(t('chat.sendFailed'), 'error');
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId || !token) return;

    if (!file.type.startsWith('image/')) {
      toast(t('chat.imageOnly'), 'info');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (!base64) return;

      setPreviewImage(base64);

      try {
        const uploadRes = await uploadApi.uploadImage(base64);
        if (uploadRes.code !== 200 || !uploadRes.data?.url) {
          toast(uploadRes.msg || t('chat.imageUploadFailed'), 'error');
          setPreviewImage(null);
          return;
        }

        const imageUrl = uploadRes.data.url;

        const response = await fetch(`${API_BASE_URL}/message/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            conversationId,
            content: imageUrl,
            type: 'image'
          })
        });
        const data = await response.json();

        if ((data.code === 200 || data.code === 201) && data.data) {
          setMessages(prev => [...(prev || []), data.data]);
          fetchConversations();
        } else {
          toast(data.msg || t('chat.sendFailed'), 'error');
        }
      } catch (error) {
        console.error('Failed to send image:', error);
        toast(t('chat.sendFailed'), 'error');
      } finally {
        setPreviewImage(null);
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowAttachMenu(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId || !token) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const fileName = file.name;

      if (!base64) return;

      try {
        const response = await fetch(`${API_BASE_URL}/message/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            conversationId,
            content: JSON.stringify({ name: fileName, data: base64 }),
            type: 'file'
          })
        });
        const data = await response.json();

        if ((data.code === 200 || data.code === 201) && data.data) {
          setMessages(prev => [...(prev || []), data.data]);
          fetchConversations();
        } else {
          toast(data.msg || t('chat.sendFailed'), 'error');
        }
      } catch (error) {
        console.error('Failed to send file:', error);
        toast(t('chat.sendFailed'), 'error');
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowAttachMenu(false);
  };

  const formatTime = (timeStr: string | undefined | null) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const formatDate = (timeStr: string | undefined | null) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (isNaN(date.getTime())) return '';
      if (date.toDateString() === today.toDateString()) return '今天';
      if (date.toDateString() === yesterday.toDateString()) return '昨天';
      return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
    } catch { return ''; }
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    if (!Array.isArray(msgs) || msgs.length === 0) return {};
    const groups: { [key: string]: Message[] } = {};
    msgs.forEach(msg => {
      if (!msg) return;
      const dateKey = formatDate(msg?.created_at);
      if (!dateKey) return;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(msg);
    });
    return groups;
  };

  if (!conversationId) {
    return (
      <div className="h-full flex items-center justify-center bg-[#FAFAFC] dark:bg-[#0A0C10]">
        <p className="text-gray-500">{t('chat.selectConversation')}</p>
      </div>
    );
  }

  const safeMessages = Array.isArray(messages) ? messages : [];
  const messageGroups = groupMessagesByDate(safeMessages);

  const renderMessageItem = useCallback((message: Message, isOwnMessage: boolean, isRecalled: boolean) => {
    return (
      <MessageItem
        message={message}
        isOwnMessage={isOwnMessage}
        isRecalled={isRecalled}
        isMobile={isMobile}
        userId={user?.id}
        onShowMenu={(msg) => {
          setSelectedMessage(msg);
          setShowMessageMenu(true);
        }}
        onRespondGameInvite={handleRespondGameInvite}
        t={t}
      />
    );
  }, [isMobile, user?.id, handleRespondGameInvite, t]);

  return (
    <div className="h-full flex flex-col bg-[#FAFAFC] dark:bg-[#0A0C10]">
      {/* Header */}
      <div className={isMobile ? "h-12 px-3 flex items-center justify-between border-b border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-[#1A1D21]/80 backdrop-blur-xl" : "h-14 px-4 flex items-center justify-between border-b border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-[#1A1D21]/80 backdrop-blur-xl"}>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => navigate(isMobile ? '/' : '/')} className={isMobile ? "p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors" : "p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"}>
            <ArrowLeft size={isMobile ? 18 : 20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h2 className={isMobile ? "font-semibold text-gray-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5" : "font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2"}>
              {conversation?.name || t('chat.message')}
              {isTempConversation && <AlertTriangle size={isMobile ? 12 : 14} className="text-yellow-500" />}
            </h2>
            <p className={isMobile ? "text-[10px] sm:text-xs hidden sm:block" : "text-xs"}>
              {isNotificationConv ? (
                <span className="text-gray-500 dark:text-gray-400">{t('chat.systemNotification')}</span>
              ) : conversation?.type === 'world' ? (
                <span className="text-gray-500 dark:text-gray-400">{t('chat.worldChannel')}</span>
              ) : otherUser ? (
                <span className={otherUser.status === 1 ? "text-[#34C759]" : "text-gray-400 dark:text-gray-500"}>
                  {otherUser.status === 1 ? t('chat.online') : formatLastSeen(otherUser.last_seen, t)}
                </span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">{t('chat.memberCount', { count: conversation?.members?.length || 0 })}</span>
              )}
            </p>
          </div>
        </div>
        {!isNotificationConv && conversation?.type !== 'world' && otherUser && (
          <button
            onClick={() => setShowGameInviteModal(true)}
            className={isMobile ? "p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors" : "p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"}
            title={t('chat.inviteChess')}
          >
            <Gamepad2 size={isMobile ? 18 : 18} className="text-[#007AFF]" />
          </button>
        )}
      </div>

      {/* Temp Conversation Warning Banner */}
      {isTempConversation && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-700/30 px-4 py-2">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 text-xs">
            <ShieldAlert size={14} />
            <span>{t('chat.tempConversationWarning')}</span>
          </div>
        </div>
      )}

      {/* Anti-Fraud Tip Modal */}
      <AnimatePresence>
        {showAntiFraudTip && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-4 mt-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-200 dark:border-yellow-700/50 rounded-xl p-4 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center flex-shrink-0">
                <ShieldAlert size={20} className="text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">{t('chat.securityTip')}</h4>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 leading-relaxed">
                  {t('chat.securityTipContent')}
                </p>
              </div>
              <button onClick={() => setShowAntiFraudTip(false)} className="text-yellow-500 hover:text-yellow-600">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      {!isNotificationConv ? (
        <VirtualMessageList
          messages={safeMessages}
          messageGroups={messageGroups}
          isLoading={isLoading}
          isLoadingHistory={isLoadingHistory}
          isMobile={isMobile}
          userId={user?.id}
          onShowMenu={(msg) => {
            setSelectedMessage(msg);
            setShowMessageMenu(true);
          }}
          onRespondGameInvite={handleRespondGameInvite}
          messagesContainerRef={messagesContainerRef}
          onLoadMore={loadOlderMessages}
          hasMore={hasMore}
          renderMessageItem={renderMessageItem}
        />
      ) : (
          <div className="space-y-3 px-0 py-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center text-black/40 dark:text-white/40 py-12">
                <Megaphone size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm">{t('chat.noNotifications')}</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const typeGradient = notif.type === 'warning' ? 'from-orange-500 to-red-500' :
                  notif.type === 'success' ? 'from-green-500 to-emerald-500' :
                  notif.type === 'announcement' ? 'from-purple-500 to-pink-500' :
                  'from-blue-500 to-cyan-500';
                const typeLabel = notif.type === 'info' ? t('chat.info') :
                  notif.type === 'warning' ? t('chat.warningLabel') :
                  notif.type === 'success' ? t('chat.successLabel') : t('chat.announcement');

                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className={`bg-gradient-to-r ${typeGradient} p-[1.5px]`}>
                      <div className="bg-white dark:bg-[#1A1D21] rounded-[14px] p-4">
                        {/* 头部：标题 + 类型标签 + 时间 */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeGradient} flex items-center justify-center flex-shrink-0`}>
                              {notif.type === 'warning' ? (
                                <AlertTriangle size={16} className="text-white" />
                              ) : notif.type === 'success' ? (
                                <CheckCircle size={16} className="text-white" />
                              ) : notif.type === 'announcement' ? (
                                <Megaphone size={16} className="text-white" />
                              ) : (
                                <Info size={16} className="text-white" />
                              )}
                            </div>
                            <h3 className="font-semibold text-black dark:text-white truncate">{notif.title}</h3>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            notif.type === 'info' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                            notif.type === 'warning' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                            notif.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                            'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                          }`}>
                            {typeLabel}
                          </span>
                        </div>

                        {/* 内容 */}
                        <p className="text-sm text-black/70 dark:text-white/60 whitespace-pre-wrap mb-3 leading-relaxed">
                          {notif.content}
                        </p>

                        {/* 图片 */}
                        {notif.image_url && (
                          <div className="rounded-xl overflow-hidden mb-2">
                            <img src={notif.image_url} alt="通知配图" className="w-full max-h-[300px] object-cover" />
                          </div>
                        )}

                        {/* 时间 */}
                        <p className="text-xs text-black/30 dark:text-white/30">
                          {new Date(notif.created_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
        <div ref={messagesEndRef} />

      {/* Message Menu */}
      <AnimatePresence>
        {showMessageMenu && selectedMessage && (
          <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMessageMenu(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, scale: 0.95 }}
              animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1 }}
              exit={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={isMobile ? "relative w-full bg-white dark:bg-[#1A1D21] rounded-t-3xl p-6 shadow-2xl" : "relative w-full max-w-sm bg-white dark:bg-[#1A1D21] rounded-2xl shadow-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden"}
            >
              {isMobile && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
              )}
              
              <div className={isMobile ? "mb-5 text-center" : "mb-4"}>
                <h3 className={isMobile ? "text-lg font-semibold text-gray-900 dark:text-white mb-1" : "text-sm font-semibold text-gray-900 dark:text-white mb-1"}>
                  {t('chat.messageActions')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {selectedMessage.content?.substring(0, 40)}{selectedMessage.content?.length > 40 ? '...' : ''}
                </p>
              </div>
              
              <div className={isMobile ? "space-y-2" : "space-y-1"}>
                <button
                  onClick={async () => {
                    try {
                      const res = await messageApi.recallMessage(selectedMessage.id);
                      if (res.code === 200) {
                        setMessages(prev => prev.map(m =>
                          m.id === selectedMessage.id
                            ? { ...m, type: 'recalled', content: t('chat.messageRecalled') }
                            : m
                        ));
                        fetchConversations();
                        toast(t('chat.recallSuccess'), 'success');
                      } else {
                        toast(res.msg || t('chat.recallFailed'), 'error');
                      }
                    } catch {
                      toast(t('chat.recallFailed'), 'error');
                    }
                    setShowMessageMenu(false);
                  }}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150",
                    isMobile ? "rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 active:bg-red-100 dark:active:bg-red-900/30" : "rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  )}
                >
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12h18M3 6h18M3 18h18" strokeDasharray="4 4" strokeDashoffset="4" />
                  </svg>
                  <span className="font-medium">{t('chat.recallMessage')}</span>
                </button>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedMessage.content);
                    toast(t('chat.copySuccess'), 'success');
                    setShowMessageMenu(false);
                  }}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150",
                    isMobile ? "rounded-xl bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 active:bg-gray-100 dark:active:bg-white/10" : "rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                  )}
                >
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  <span className="font-medium">{t('chat.copyAction')}</span>
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      const conversations = await import('../../api/conversation').then(m => m.conversationApi.getList());
                      if (conversations.code === 200) {
                        const targets = conversations.data.filter((c: Conversation) => c.id !== conversationId);
                        if (targets.length === 0) {
                          toast(t('chat.noOtherConversations'), 'warning');
                          setShowMessageMenu(false);
                          return;
                        }
                        const target = targets[0];
                        await messageApi.sendMessage({
                          conversationId: target.id,
                          content: selectedMessage.content,
                          type: selectedMessage.type
                        });
                        toast(t('chat.forwardSuccess'), 'success');
                      }
                    } catch {
                      toast(t('chat.forwardFailed'), 'error');
                    }
                    setShowMessageMenu(false);
                  }}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150",
                    isMobile ? "rounded-xl bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 active:bg-gray-100 dark:active:bg-white/10" : "rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                  )}
                >
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"/>
                  </svg>
                  <span className="font-medium">{t('chat.forwardAction')}</span>
                </button>
                
                <button
                  onClick={() => setShowMessageMenu(false)}
                  className={clsx(
                    "w-full flex items-center justify-center px-4 py-3 mt-2 text-left transition-all duration-150",
                    isMobile ? "rounded-xl bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-medium active:bg-gray-200 dark:active:bg-white/20" : "rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                  )}
                >
                  {t('chat.cancelAction')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview */}
      <AnimatePresence>
        {previewImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-2 bg-gray-100 dark:bg-[#1A1D21]">
            <div className="relative inline-block">
              <img src={previewImage} alt="Preview" className="h-20 rounded-lg" />
              <button onClick={() => setPreviewImage(null)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full">
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      {!isNotificationConv && (
      <div className={isMobile ? "px-3 py-2.5 border-t border-gray-200/50 dark:border-white/10 bg-white/90 dark:bg-[#1A1D21]/90 backdrop-blur-xl" : "p-4 border-t border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-[#1A1D21]/80 backdrop-blur-xl"}>
        <div className="flex items-end gap-2 sm:gap-3">
          <div className="relative">
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className={isMobile ? "p-2.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors flex-shrink-0" : "p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors flex-shrink-0"}
            >
              <Plus size={isMobile ? 22 : 20} className="text-gray-600 dark:text-gray-300" />
            </button>
            {showAttachMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="absolute bottom-14 left-0 bg-white dark:bg-[#1A1D21] rounded-xl shadow-lg border border-gray-200/50 dark:border-white/10 p-2 min-w-[120px] z-50">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" id="image-upload" />
                <label htmlFor="image-upload" className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg cursor-pointer text-sm active:bg-gray-200 dark:active:bg-white/20">
                  <Image size={16} /> {t('chat.image')}
                </label>
              </motion.div>
            )}
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('chat.sendPlaceholder')}
              className={isMobile ? "w-full h-11 px-4 bg-gray-100 dark:bg-[#0E1116] rounded-full outline-none text-[15px] text-gray-900 dark:text-white placeholder:text-gray-400" : "w-full h-11 px-4 bg-gray-100 dark:bg-[#0E1116] rounded-full outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={isMobile ? "p-2.5 bg-[#007AFF] hover:bg-[#006CE0] disabled:opacity-40 disabled:cursor-not-allowed rounded-full transition-all flex-shrink-0 w-11 h-11 flex items-center justify-center" : "p-2.5 bg-[#007AFF] hover:bg-[#006CE0] disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors flex-shrink-0"}
          >
            <Send size={isMobile ? 18 : 18} className="text-white" />
          </button>
        </div>
      </div>
      )}

      {/* Game Invite Modal */}
      <AnimatePresence>
        {showGameInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowGameInviteModal(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={isMobile ? "relative z-10 w-full bg-white dark:bg-[#1A1D21] rounded-2xl shadow-2xl overflow-hidden" : "relative z-10 w-full max-w-sm bg-white dark:bg-[#1A1D21] rounded-2xl shadow-2xl overflow-hidden"}
            >
              <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('game.inviteTitle')}</h3>
                  <button
                    onClick={() => setShowGameInviteModal(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={18} className="text-gray-400" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('game.inviteDesc')} <span className="font-medium text-gray-700 dark:text-gray-300">{otherUser?.nickname || otherUser?.username || t('game.opponent')}</span>
                </p>
              </div>

              <div className="p-4 space-y-3">
                {[
                  { key: 'tictactoe', name: t('game.tictactoe'), icon: '⭕', desc: t('game.tictactoeDesc') },
                  { key: 'gomoku', name: t('game.gomoku'), icon: '⚫', desc: t('game.gomokuDesc') },
                  { key: 'chess', name: t('game.chess'), icon: '♟️', desc: t('game.chessDesc') },
                ].map((game) => (
                  <button
                    key={game.key}
                    onClick={() => handleInviteGame(game.key)}
                    disabled={isInvitingGame}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/10 hover:border-[#007AFF]/30 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group disabled:opacity-50"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{game.icon}</span>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{game.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{game.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-[#007AFF] transition-colors" />
                  </button>
                ))}
              </div>

              <div className="px-5 py-3 bg-gray-50 dark:bg-black/20 text-center">
                <p className="text-xs text-gray-400">{t('game.selectGameMode')}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer />
    </div>
  );
}
