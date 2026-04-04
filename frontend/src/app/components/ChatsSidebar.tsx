import { useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router";
import { Search, Edit, CheckCheck, MessageSquare, AlertTriangle, Users } from "lucide-react";
import { motion } from "motion/react";
import { clsx } from "clsx";
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { messageApi, SearchMessageResult } from '../../api/message';
import { tempConversationApi } from '../../api/tempConversation';
import { CreateGroupModal } from './CreateGroupModal';

export function ChatsSidebar() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMessageResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [tempConversations, setTempConversations] = useState<Set<number>>(new Set());
  const { conversations, fetchConversations, isLoading } = useChatStore();
  const { user, token } = useAuthStore();
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

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
            // ignore
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
      return chat.members.find((m: any) => m.id !== user?.id) || { nickname: 'Unknown', avatar: '' };
    }
    return { nickname: chat.name || 'Unknown', avatar: chat.avatar || '' };
  };

  const formatTime = (timeStr: string | undefined) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleSearchResultClick = (msg: SearchMessageResult) => {
    navigate(`/chat/${msg.conversation_id}`);
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="sticky top-0 z-40 bg-white/60 dark:bg-[#13161A]/60 backdrop-blur-3xl pt-8 pb-4 px-4 border-b border-black/5 dark:border-white/5 flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-xl font-semibold text-black dark:text-white tracking-tight">Messages</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowCreateGroup(true)}
              className="text-black/40 hover:text-[#007AFF] dark:text-white/40 dark:hover:text-[#007AFF] transition-colors bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 p-2 rounded-full"
              title="创建群组"
            >
              <Users size={18} strokeWidth={2} />
            </button>
            <button className="text-black/40 hover:text-[#007AFF] dark:text-white/40 dark:hover:text-[#007AFF] transition-colors bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 p-2 rounded-full">
              <Edit size={18} strokeWidth={2} />
            </button>
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
            placeholder="Search messages"
            className="w-full h-[38px] pl-9 pr-4 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-[15px] text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:bg-white dark:focus:bg-[#1A1D21] focus:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:focus:shadow-[0_4px_16px_rgba(0,0,0,0.2)] focus:border-[#007AFF]/30 border border-transparent transition-all"
          />
        </div>
      </div>

      {searchQuery.trim().length >= 2 && (
        <div className="flex-1 overflow-y-auto py-3 px-2">
          <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#13161A]/80 backdrop-blur-md px-3 py-2 mb-2 rounded-xl">
            <span className="text-[12px] font-semibold text-[#007AFF]">
              Search Results ({searchResults.length})
            </span>
          </div>

          {searchResults.length === 0 && !isSearching && (
            <div className="flex flex-col items-center justify-center h-32 text-black/40 dark:text-white/40 text-sm">
              <MessageSquare size={32} className="mb-2 opacity-50" />
              <p>No messages found</p>
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
              <p>No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat!</p>
            </div>
          )}

          {conversations.map((chat, index) => {
            const isActive = id === String(chat.id);
            const otherUser = chat.type === 'single' ? getOtherUser(chat) : null;
            const displayName = otherUser?.nickname || chat.name || 'Unknown';
            const displayAvatar = otherUser?.avatar || chat.avatar || '';
            const isGroup = chat.type === 'group';

            return (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(isGroup ? `/group/${chat.id}` : `/chat/${chat.id}`)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 mx-2 rounded-[14px] cursor-pointer transition-all duration-200 relative mb-1",
                  isActive
                    ? "bg-[#007AFF] text-white shadow-[0_4px_16px_rgba(0,122,255,0.25)]"
                    : "hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white"
                )}
              >
                <div className="relative flex-shrink-0">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt={displayName} className="w-[46px] h-[46px] rounded-full object-cover shadow-sm" />
                  ) : (
                    <div className="w-[46px] h-[46px] rounded-full bg-[#007AFF] flex items-center justify-center text-white font-semibold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {!isGroup && otherUser?.status === 1 && (
                    <div className={clsx(
                      "absolute bottom-0 right-0 w-[12px] h-[12px] rounded-full border-2",
                      isActive ? "bg-[#34C759] border-[#007AFF]" : "bg-[#34C759] border-white dark:border-[#13161A]"
                    )} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h2 className={clsx("text-[15px] font-semibold truncate pr-2 flex items-center gap-1", isActive ? "text-white" : "text-black dark:text-white")}>
                      {displayName}
                      {tempConversations.has(chat.id) && (
                        <AlertTriangle size={12} className="text-yellow-500 flex-shrink-0" />
                      )}
                    </h2>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {chat.unread_count === 0 && (
                        <CheckCheck size={14} className={isActive ? "text-white/70" : "text-[#007AFF] opacity-80"} />
                      )}
                      <span className={clsx("text-[12px]", isActive ? "text-white/70" : "text-black/40 dark:text-white/40")}>
                        {formatTime(chat.last_message_time)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <p className={clsx("text-[13px] truncate tracking-tight", isActive ? "text-white/80" : "text-black/50 dark:text-white/50")}>
                      {chat.last_message || (isGroup ? 'Group conversation' : 'No messages yet')}
                    </p>
                    {(chat.unread_count || 0) > 0 && (
                      <div className={clsx(
                        "w-[18px] h-[18px] flex-shrink-0 rounded-full flex items-center justify-center",
                        isActive ? "bg-white" : "bg-[#007AFF]"
                      )}>
                        <span className={clsx("text-[11px] font-bold leading-none", isActive ? "text-[#007AFF]" : "text-white")}>
                          {chat.unread_count}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onSuccess={() => fetchConversations()}
      />
    </div>
  );
}
