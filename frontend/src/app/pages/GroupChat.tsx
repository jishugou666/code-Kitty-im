import { useParams, useNavigate } from "react-router";
import { ArrowLeft, MoreHorizontal, Plus, Paperclip, BarChart2, Smile, Mic, Phone, Video, Send, Users, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { conversationApi } from '../../api/conversation';
import { userApi } from '../../api/user';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function GroupChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const conversationId = parseInt(id || '0');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, token } = useAuthStore();
  const { conversations, fetchConversations } = useChatStore();

  const conversation = conversations.find(c => c.id === conversationId);

  useEffect(() => {
    if (conversationId) {
      loadGroupInfo();
      loadMessages();
    }
  }, [conversationId]);

  const loadGroupInfo = async () => {
    try {
      const response = await conversationApi.getConversation(conversationId);
      if (response.data) {
        setGroupInfo(response.data);
      }
    } catch (error) {
      console.error('Failed to load group info:', error);
    }
  };

  const loadMessages = async () => {
    if (!conversationId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/message/list?conversationId=${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.code === 200) {
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId) return;

    const text = input.trim();
    setInput("");

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
      if (data.code === 200) {
        setMessages(prev => [...prev, data.data]);
        fetchConversations();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleSearchUser = async (keyword: string) => {
    if (keyword.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await userApi.searchUsers(keyword);
      const existingMemberIds = (groupInfo?.members || []).map((m: any) => m.id);
      setSearchResults((response.data || []).filter((u: any) => !existingMemberIds.includes(u.id)));
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleAddMember = async (userId: number) => {
    try {
      await conversationApi.addMembers(conversationId, [userId]);
      loadGroupInfo();
      setShowAddMember(false);
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  const renderTextWithMentions = (text: string) => {
    return text.split(/(@\w+)/g).map((part, i) => {
      if (part.startsWith("@")) {
        return <span key={i} className="text-[#007AFF] font-medium bg-[#007AFF]/10 dark:bg-[#007AFF]/20 px-1 rounded-sm">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const formatTime = (timeStr: string | undefined) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const isAdmin = groupInfo?.role === 'owner' || groupInfo?.role === 'admin';
  const onlineCount = (groupInfo?.members || []).filter((m: any) => m.status === 1).length;
  const totalCount = (groupInfo?.members || []).length;

  return (
    <div className="flex flex-col h-full bg-[#FAFAFC] dark:bg-[#0A0C10] relative">
      <div className="absolute top-[30%] left-[10%] w-[400px] h-[400px] bg-indigo-100/30 dark:bg-indigo-900/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="sticky top-0 z-40 bg-white/70 dark:bg-[#13161A]/70 backdrop-blur-3xl pt-6 pb-4 px-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.01)]">
        <div className="flex items-center gap-4 cursor-pointer group">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-black dark:text-white" />
          </button>
          <div className="relative">
            {groupInfo?.avatar ? (
              <img src={groupInfo.avatar} alt={groupInfo.name} className="w-11 h-11 rounded-full object-cover shadow-sm" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#007AFF] to-purple-500 flex items-center justify-center text-white font-semibold">
                {(groupInfo?.name || 'G')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[17px] font-semibold text-black dark:text-white leading-tight">{groupInfo?.name || 'Group Chat'}</span>
            <span className="text-[13px] text-black/40 dark:text-white/40 mt-0.5">{totalCount} Members • {onlineCount} Online</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2.5 text-black/40 hover:text-[#007AFF] dark:text-white/40 dark:hover:text-[#007AFF] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <Phone size={20} strokeWidth={2} />
          </button>
          <button className="p-2.5 text-black/40 hover:text-[#007AFF] dark:text-white/40 dark:hover:text-[#007AFF] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <Video size={20} strokeWidth={2} />
          </button>
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="p-2.5 text-black/40 hover:text-[#007AFF] dark:text-white/40 dark:hover:text-[#007AFF] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <Users size={20} strokeWidth={2} />
          </button>
          <div className="w-[1px] h-6 bg-black/10 dark:bg-white/10 mx-1" />
          <button className="p-2.5 text-black/40 hover:text-[#007AFF] dark:text-white/40 dark:hover:text-[#007AFF] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <MoreHorizontal size={20} strokeWidth={2} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showMembers && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-0 right-0 bottom-0 w-[320px] bg-white dark:bg-[#13161A] z-50 shadow-[-8px_0_32px_rgba(0,0,0,0.1)] border-l border-black/5 dark:border-white/5 overflow-y-auto"
          >
            <div className="sticky top-0 z-10 bg-white dark:bg-[#13161A] p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black dark:text-white">Members</h2>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="p-2 bg-[#007AFF] hover:bg-[#006CE0] text-white rounded-full transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                )}
                <button
                  onClick={() => setShowMembers(false)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <X size={20} className="text-black/40 dark:text-white/40" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {(groupInfo?.members || []).map((member: any) => (
                <div key={member.id} className="flex items-center gap-3 py-2 mb-2">
                  <div className="relative">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.nickname} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#007AFF] flex items-center justify-center text-white font-semibold text-sm">
                        {(member.nickname || member.username || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    {member.status === 1 && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#34C759] border-2 border-white dark:border-[#13161A] rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black dark:text-white truncate">{member.nickname || member.username}</p>
                    <p className="text-xs text-black/40 dark:text-white/40 truncate">@{member.username}</p>
                  </div>
                  {member.role === 'owner' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#007AFF] bg-[#007AFF]/10 px-2 py-1 rounded">Owner</span>
                  )}
                  {member.role === 'admin' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 bg-purple-500/10 px-2 py-1 rounded">Admin</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={() => setShowAddMember(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-[400px] bg-white dark:bg-[#1A1D21] rounded-2xl p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black dark:text-white">Add Members</h3>
                <button onClick={() => setShowAddMember(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
                  <X size={20} className="text-black/40 dark:text-white/40" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Search users..."
                onChange={(e) => handleSearchUser(e.target.value)}
                className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 mb-4"
              />

              <div className="max-h-[300px] overflow-y-auto">
                {searchResults.map((result) => (
                  <div key={result.id} className="flex items-center gap-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl px-2 cursor-pointer" onClick={() => handleAddMember(result.id)}>
                    <div className="w-10 h-10 rounded-full bg-[#007AFF] flex items-center justify-center text-white font-semibold text-sm">
                      {(result.nickname || result.username || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black dark:text-white truncate">{result.nickname || result.username}</p>
                      <p className="text-xs text-black/40 dark:text-white/40 truncate">@{result.username}</p>
                    </div>
                    <button className="p-2 bg-[#007AFF]/10 text-[#007AFF] rounded-full">
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6 relative z-10 scrollbar-hide">
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-black/40 dark:text-white/40 text-sm">
              <p>No messages yet</p>
              <p className="text-xs mt-1">Start the conversation!</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={clsx(
                  "flex max-w-[70%]",
                  isMe ? "self-end justify-end" : "self-start justify-start gap-3"
                )}
              >
                {!isMe && (
                  <div className="w-9 h-9 rounded-full bg-[#007AFF] flex items-center justify-center text-white font-semibold text-sm mt-auto mb-5">
                    {(msg.nickname || msg.username || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className={clsx("flex flex-col", isMe ? "items-end" : "items-start")}>
                  {!isMe && (
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      <span className="text-[13px] font-semibold text-black/60 dark:text-white/60">{msg.nickname || msg.username}</span>
                    </div>
                  )}
                  <div
                    className={clsx(
                      "px-4 py-3 rounded-[20px] text-[15px] leading-[1.5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] backdrop-blur-md",
                      isMe
                        ? "bg-gradient-to-tr from-[#007AFF] to-[#5AC8FA] text-white rounded-br-sm border border-white/20 dark:border-white/5"
                        : "bg-white/90 dark:bg-[#23272D]/90 text-black dark:text-white rounded-bl-sm border border-black/5 dark:border-white/5"
                    )}
                  >
                    {renderTextWithMentions(msg.content)}
                  </div>
                  <span className="text-[12px] text-black/30 dark:text-white/30 mt-1.5 px-1 font-medium">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <AnimatePresence>
        {showAttachMenu && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-[90px] left-1/2 -translate-x-1/2 w-[300px] bg-white/90 dark:bg-[#1A1D21]/90 backdrop-blur-2xl rounded-[24px] p-5 flex justify-around shadow-[0_16px_48px_rgba(0,0,0,0.1)] border border-white/40 dark:border-white/10 z-30"
          >
            <button className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center text-[#007AFF] group-hover:scale-110 transition-transform shadow-sm">
                <Paperclip size={24} />
              </div>
              <span className="text-[12px] font-medium text-black/60 dark:text-white/60">File</span>
            </button>
            <button className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 bg-purple-50 dark:bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform shadow-sm">
                <BarChart2 size={24} />
              </div>
              <span className="text-[12px] font-medium text-black/60 dark:text-white/60">Poll</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pb-8 pt-4 px-8 bg-white/70 dark:bg-[#13161A]/70 backdrop-blur-3xl border-t border-black/5 dark:border-white/5 flex justify-center z-40 relative">
        <div className="max-w-4xl w-full flex items-end gap-3">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={clsx(
              "p-3 rounded-full transition-colors flex-shrink-0",
              showAttachMenu ? "bg-[#007AFF]/10 text-[#007AFF]" : "text-black/40 hover:text-[#007AFF] dark:text-white/40 dark:hover:text-[#007AFF] hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <Plus size={24} strokeWidth={2.5} className={showAttachMenu ? "rotate-45 transition-transform" : "transition-transform"} />
          </button>

          <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-[24px] min-h-[46px] max-h-[140px] flex items-center px-4 border border-transparent focus-within:border-black/5 dark:focus-within:border-white/5 focus-within:shadow-[0_4px_16px_rgba(0,0,0,0.04)] focus-within:bg-white dark:focus-within:bg-[#1A1D21] transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Message group..."
              className="flex-1 bg-transparent border-none outline-none py-3 text-[15px] text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40"
            />
            <button className="p-2 text-black/40 dark:text-white/40 hover:text-[#007AFF] transition-colors ml-1">
              <Smile size={20} strokeWidth={2} />
            </button>
          </div>

          {input.trim() ? (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={handleSend}
              className="w-[46px] h-[46px] bg-[#007AFF] hover:bg-[#006ce0] rounded-full flex items-center justify-center text-white shadow-md active:scale-95 transition-all flex-shrink-0"
            >
              <Send size={18} strokeWidth={2.5} className="ml-0.5" />
            </motion.button>
          ) : (
            <button className="p-3 text-black/40 hover:text-[#007AFF] dark:text-white/40 dark:hover:text-[#007AFF] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors flex-shrink-0">
              <Mic size={24} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
