import { useTranslation } from 'react-i18next';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from "react-router";
import { Search, Edit, CheckCheck, MessageSquare, AlertTriangle, Users, Pin, PinOff, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx } from "clsx";
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { messageApi, SearchMessageResult } from '../../api/message';
import { tempConversationApi } from '../../api/tempConversation';
import { CreateGroupModal } from './CreateGroupModal';
import { useIsMobile } from './ui/use-mobile';

interface PinnedConversation {
  id: number;
  type: 'pinned';
}

export function ChatsSidebar() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMessageResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [tempConversations, setTempConversations] = useState<Set<number>>(new Set());
  const [pinnedConversations, setPinnedConversations] = useState<Set<number>>(new Set());
  const [collapsedPrivate, setCollapsedPrivate] = useState(false);
  const [collapsedGroup, setCollapsedGroup] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; chatId: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const { conversations, fetchConversations, isLoading } = useChatStore();
  const { user, token } = useAuthStore();
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    const saved = localStorage.getItem('pinnedConversations');
    if (saved) {
      setPinnedConversations(new Set(JSON.parse(saved)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pinnedConversations', JSON.stringify([...pinnedConversations]));
  }, [pinnedConversations]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  useEffect(() => {
    const handleLongPress = (e: CustomEvent) => {
      const chatId = e.detail?.chatId;
      if (chatId) {
        togglePin(chatId);
      }
    };
    window.addEventListener('longPressChat' as any, handleLongPress);
    return () => window.removeEventListener('longPressChat' as any, handleLongPress);
  }, [pinnedConversations]);

  useEffect(() => {
    const checkTempConversations = async () => {
      if (!token || conversations.length === 0) return;
      const tempSet = new Set<number>();
      for (const chat of conversations) {
        if (chat.type === 'single') {
          try {
            const result = await tempConversationApi.check(chat.id);
            if (result.isTemp) {
              tempSet.add(chat.id);
            }
          } catch (e) {
          }
        }
      }
      setTempConversations(tempSet);
    };
    checkTempConversations();
  }, [conversations, token]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await messageApi.searchMessages(searchQuery);
        setSearchResults(response.data || []);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getOtherUser = (chat: any) => {
    if (chat.type === 'single' && chat.members) {
      const otherMember = chat.members.find((m: any) => m.id !== user?.id) || { nickname: 'Unknown', avatar: '', role: 'user' };
      return otherMember;
    }
    return { nickname: chat.name || 'Unknown', avatar: chat.avatar || '', role: 'user' };
  };

  const formatTime = (timeStr: string | undefined) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return t('chat.yesterday');
    } else if (days < 7) {
      return date.toLocaleDateString('zh-CN', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  const togglePin = (chatId: number) => {
    setPinnedConversations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chatId)) {
        newSet.delete(chatId);
      } else {
        newSet.add(chatId);
      }
      return newSet;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, chatId: number) => {
    if (isMobile) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, chatId });
  };

  const handleSearchResultClick = (msg: SearchMessageResult) => {
    navigate(`/chat/${msg.conversation_id}`);
    setSearchQuery("");
  };

  const privateChats = conversations
    .filter(c => c.type === 'single')
    .sort((a, b) => {
      if (pinnedConversations.has(a.id) && !pinnedConversations.has(b.id)) return -1;
      if (!pinnedConversations.has(a.id) && pinnedConversations.has(b.id)) return 1;
      const techGodA = a.members?.some((m: any) => m.nickname === '技术狗');
      const techGodB = b.members?.some((m: any) => m.nickname === '技术狗');
      if (techGodA && !techGodB) return -1;
      if (!techGodA && techGodB) return 1;
      return new Date(b.last_message_time || 0).getTime() - new Date(a.last_message_time || 0).getTime();
    });

  const groupChats = conversations
    .filter(c => c.type === 'group')
    .sort((a, b) => {
      if (pinnedConversations.has(a.id) && !pinnedConversations.has(b.id)) return -1;
      if (!pinnedConversations.has(a.id) && pinnedConversations.has(b.id)) return 1;
      return new Date(b.last_message_time || 0).getTime() - new Date(a.last_message_time || 0).getTime();
    });

  const renderChatItem = (chat: any, isGroup: boolean) => {
    const isActive = id === String(chat.id);
    const otherUser = isGroup ? null : getOtherUser(chat);
    const displayName = isGroup ? (chat.name || '群聊') : (otherUser?.nickname || 'Unknown');
    const displayAvatar = isGroup ? (chat.avatar || '') : (otherUser?.avatar || '');
    const isPinned = pinnedConversations.has(chat.id);
    const isTechGod = !isGroup && otherUser?.nickname === '技术狗';

    return (
      <motion.div
        key={chat.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onClick={() => navigate(isGroup ? `/group/${chat.id}` : `/chat/${chat.id}`)}
        onContextMenu={(e) => handleContextMenu(e, chat.id)}
        onTouchEnd={() => {
          if (isMobile) {
            window.dispatchEvent(new CustomEvent('longPressChat', { detail: { chatId: chat.id } }));
          }
        }}
        className={clsx(
          "flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2.5 mx-1 sm:mx-2 rounded-xl sm:rounded-[14px] cursor-pointer transition-all duration-200 relative mb-1",
          isActive
            ? "bg-[#007AFF] text-white shadow-[0_4px_16px_rgba(0,122,255,0.25)]"
            : "hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white"
        )}
      >
        {isPinned && !isTechGod && (
          <Pin size={12} className="absolute top-1 right-1 text-[#007AFF] dark:text-white/60" />
        )}
        <div className="relative flex-shrink-0">
          {displayAvatar ? (
            <img src={displayAvatar} alt={displayName} className={isMobile ? "w-10 h-10 rounded-full object-cover shadow-sm" : "w-[46px] h-[46px] rounded-full object-cover shadow-sm"} />
          ) : (
            <div className={isMobile ? "w-10 h-10 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white font-semibold text-sm" : "w-[46px] h-[46px] rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white font-semibold"}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          {!isGroup && otherUser?.status === 1 && (
            <div className={clsx(
              "absolute bottom-0 right-0 w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] rounded-full border-2",
              isActive ? "bg-[#34C759] border-[#007AFF]" : "bg-[#34C759] border-white dark:border-[#13161A]"
            )} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-0.5">
            <h2 className={clsx("text-[14px] sm:text-[15px] font-semibold truncate pr-2 flex items-center gap-1", isActive ? "text-white" : "text-black dark:text-white")}>
              {displayName}
              {isTechGod && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center gap-0.5">
                  <Pin size={8} />{t('chat.siteOwner')}
                </span>
              )}
              {tempConversations.has(chat.id) && (
                <AlertTriangle size={isMobile ? 10 : 12} className="text-yellow-500 flex-shrink-0" />
              )}
            </h2>
            <div className="flex items-center gap-1 flex-shrink-0">
              {chat.unread_count === 0 && (
                <CheckCheck size={isMobile ? 12 : 14} className={isActive ? "text-white/70" : "text-[#007AFF] opacity-80"} />
              )}
              <span className={clsx("text-[11px] sm:text-[12px]", isActive ? "text-white/70" : "text-black/40 dark:text-white/40")}>
                {formatTime(chat.last_message_time)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center gap-2">
            <p className={clsx("text-[12px] sm:text-[13px] truncate tracking-tight", isActive ? "text-white/80" : "text-black/50 dark:text-white/50")}>
              {chat.last_message || (isGroup ? t('chat.groupConversation') : t('chat.noMessagesYet'))}
            </p>
            {(chat.unread_count || 0) > 0 && (
              <div className={clsx(
                "w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] flex-shrink-0 rounded-full flex items-center justify-center",
                isActive ? "bg-white" : "bg-[#007AFF]"
              )}>
                <span className={clsx("text-[10px] sm:text-[11px] font-bold leading-none", isActive ? "text-[#007AFF]" : "text-white")}>
                  {chat.unread_count}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderCategory = (
    title: string,
    icon: React.ReactNode,
    chats: any[],
    isCollapsed: boolean,
    onToggle: () => void,
    colorClass: string = 'text-[#007AFF]'
  ) => (
    <div className="mb-2">
      <div
        className="sticky top-0 z-30 bg-white/80 dark:bg-[#13161A]/80 backdrop-blur-md px-5 py-2 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className={clsx("text-[12px] font-bold", colorClass)}>
            {title} ({chats.length})
          </span>
        </div>
        <motion.div
          animate={{ rotate: isCollapsed ? -90 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-black/30 dark:text-white/30"
        >
          ▼
        </motion.div>
      </div>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-black/40 dark:text-white/40 text-sm">
                <MessageCircle size={24} className="mb-1 opacity-50" />
                <p>{t('chat.noConversationsYet')}</p>
              </div>
            ) : (
              chats.map(chat => renderChatItem(chat, chat.type === 'group'))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className={isMobile ? "sticky top-0 z-40 bg-white/80 dark:bg-[#13161A]/80 backdrop-blur-3xl pt-4 pb-3 px-3 border-b border-black/5 dark:border-white/5 flex flex-col gap-3" : "sticky top-0 z-40 bg-white/60 dark:bg-[#13161A]/60 backdrop-blur-3xl pt-8 pb-4 px-4 border-b border-black/5 dark:border-white/5 flex flex-col gap-4"}>
        <div className="flex items-center justify-between px-1">
          <h1 className={isMobile ? "text-lg font-semibold text-black dark:text-white tracking-tight" : "text-xl font-semibold text-black dark:text-white tracking-tight"}>{t('chat.message')}</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowCreateGroup(true)}
              className="text-black/40 hover:text-[#007AFF] dark:text-white/40 dark:hover:text-[#007AFF] transition-colors bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 p-2 rounded-full"
              title={t('chat.createGroup')}
            >
              <Users size={isMobile ? 16 : 18} strokeWidth={2} />
            </button>
            {!isMobile && (
              <button className="text-black/40 hover:text-[#007AFF] dark:text-white/40 dark:hover:text-[#007AFF] transition-colors bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 p-2 rounded-full">
                <Edit size={18} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search size={16} className="text-black/30 dark:text-white/30 group-focus-within:text-[#007AFF] transition-colors" />
            )}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('chat.searchPlaceholder')}
            className={isMobile ? "w-full h-[36px] pl-9 pr-4 bg-black/5 dark:bg-white/5 rounded-lg outline-none text-[14px] text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:bg-white dark:focus:bg-[#1A1D21] focus:border-[#007AFF]/30 border border-transparent transition-all" : "w-full h-[38px] pl-9 pr-4 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-[15px] text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:bg-white dark:focus:bg-[#1A1D21] focus:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:focus:shadow-[0_4px_16px_rgba(0,0,0,0.2)] focus:border-[#007AFF]/30 border border-transparent transition-all"}
          />
        </div>
      </div>

      {searchQuery.trim().length >= 2 && (
        <div className="flex-1 overflow-y-auto py-3 px-2">
          <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#13161A]/80 backdrop-blur-md px-3 py-2 mb-2 rounded-xl">
            <span className="text-[12px] font-semibold text-[#007AFF]">
              {t('chat.searchResults')} ({searchResults.length})
            </span>
          </div>

          {searchResults.length === 0 && !isSearching && (
            <div className="flex flex-col items-center justify-center h-32 text-black/40 dark:text-white/40 text-sm">
              <MessageSquare size={32} className="mb-2 opacity-50" />
              <p>{t('chat.searchNoResults')}</p>
            </div>
          )}

          {searchResults.map((msg) => (
            <motion.div
              key={`${msg.conversation_id}-${msg.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleSearchResultClick(msg)}
              className="flex items-start gap-3 py-3 px-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-colors mb-1"
            >
              <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare size={18} className="text-[#007AFF]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[14px] font-medium text-black dark:text-white truncate">
                    {msg.conversation_type === 'group' ? msg.conversation_name : msg.nickname || msg.username}
                  </span>
                  <span className="text-[11px] text-black/40 dark:text-white/40 flex-shrink-0 ml-2">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <p className="text-[13px] text-black/50 dark:text-white/50 truncate">
                  {msg.nickname || msg.username}: {msg.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {searchQuery.trim().length < 2 && (
        <div className="flex-1 overflow-y-auto py-3 scrollbar-hide">
          {isLoading && conversations.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {conversations.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-32 text-black/40 dark:text-white/40 text-sm">
              <p>{t('chat.noConversationsYet')}</p>
              <p className="text-xs mt-1">{t('chat.startNewChat')}</p>
            </div>
          )}

          {renderCategory(
            t('chat.privateChats'),
            <MessageCircle size={14} className="text-[#007AFF]" />,
            privateChats,
            collapsedPrivate,
            () => setCollapsedPrivate(!collapsedPrivate)
          )}

          {renderCategory(
            t('chat.groupChats'),
            <Users size={14} className="text-purple-500" />,
            groupChats,
            collapsedGroup,
            () => setCollapsedGroup(!collapsedGroup),
            'text-purple-500'
          )}
        </div>
      )}

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-[100] bg-white dark:bg-[#1A1D21] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-black/10 dark:border-white/10 py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              togglePin(contextMenu.chatId);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 transition-colors"
          >
            {pinnedConversations.has(contextMenu.chatId) ? (
              <>
                <PinOff size={16} className="text-[#007AFF]" />
                {t('chat.unpin')}
              </>
            ) : (
              <>
                <Pin size={16} className="text-[#007AFF]" />
                {t('chat.pin')}
              </>
            )}
          </button>
        </div>
      )}

      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
      )}
    </div>
  );
}