import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Info, Plus, Send, Image, File, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const conversationId = parseInt(id || '0');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, token } = useAuthStore();
  const { conversations, fetchConversations } = useChatStore();
  const { toast, ToastContainer } = useToast();

  const conversation = conversations.find(c => c.id === conversationId);

  useEffect(() => {
    if (conversationId && token) {
      loadMessages();
    }
  }, [conversationId, token]);

  const loadMessages = async () => {
    if (!conversationId || !token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/message/list?conversationId=${conversationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.code === 200 && Array.isArray(data.data)) {
        setMessages(data.data || []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
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
    if (!input.trim() || !conversationId || !token) return;

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

      if (data.code === 200 && data.data) {
        setMessages(prev => [...(prev || []), data.data]);
        fetchConversations();
      } else {
        toast(data.msg || '发送失败', 'error');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast('发送失败', 'error');
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId || !token) return;

    if (!file.type.startsWith('image/')) {
      toast('只支持图片文件', 'info');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (!base64) return;

      setPreviewImage(base64);

      try {
        const response = await fetch(`${API_BASE_URL}/message/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            conversationId,
            content: base64,
            type: 'image'
          })
        });
        const data = await response.json();

        if (data.code === 200 && data.data) {
          setMessages(prev => [...(prev || []), data.data]);
          fetchConversations();
        } else {
          toast(data.msg || '发送失败', 'error');
        }
      } catch (error) {
        console.error('Failed to send image:', error);
        toast('发送失败', 'error');
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

        if (data.code === 200 && data.data) {
          setMessages(prev => [...(prev || []), data.data]);
          fetchConversations();
        } else {
          toast(data.msg || '发送失败', 'error');
        }
      } catch (error) {
        console.error('Failed to send file:', error);
        toast('发送失败', 'error');
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

  const groupMessagesByDate = (msgs: any[]) => {
    if (!Array.isArray(msgs) || msgs.length === 0) return {};
    const groups: { [key: string]: any[] } = {};
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
        <p className="text-gray-500">请选择一个会话</p>
      </div>
    );
  }

  const safeMessages = Array.isArray(messages) ? messages : [];
  const messageGroups = groupMessagesByDate(safeMessages);

  return (
    <div className="h-full flex flex-col bg-[#FAFAFC] dark:bg-[#0A0C10]">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-[#1A1D21]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
              {conversation?.name || '聊天'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(conversation?.members?.length || 0)} 位成员
            </p>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
          <Info size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : safeMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 dark:text-gray-500">
            <p>暂无消息</p>
            <p className="text-xs mt-1">开始聊天吧</p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-gray-200/50 dark:bg-white/10" />
                <span className="text-xs text-gray-400 dark:text-gray-500 px-2">{date}</span>
                <div className="flex-1 h-px bg-gray-200/50 dark:bg-white/10" />
              </div>
              {Array.isArray(msgs) && msgs.map((message) => {
                if (!message) return null;
                const isOwnMessage = message.sender_id === user?.id;
                return (
                  <motion.div
                    key={message.id || Math.random()}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx("flex mb-3", isOwnMessage ? "justify-end" : "justify-start")}
                  >
                    {!isOwnMessage && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center text-white text-xs font-semibold mr-2 flex-shrink-0">
                        {(message.sender_nickname || 'U')[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className={clsx("max-w-[70%] rounded-2xl px-4 py-2", isOwnMessage ? "bg-[#007AFF] text-white" : "bg-white dark:bg-[#1A1D21] text-gray-900 dark:text-white")}>
                      {message.type === 'text' && <p className="text-sm">{message.content}</p>}
                      {message.type === 'image' && <img src={message.content} alt="图片" className="rounded-lg max-w-full" />}
                      {message.type === 'file' && (
                        (() => {
                          try {
                            const fileData = JSON.parse(message.content || '{}');
                            return (
                              <div className="flex items-center gap-2">
                                <File size={16} />
                                <span className="text-sm">{fileData.name || '未知文件'}</span>
                              </div>
                            );
                          } catch { return <p className="text-sm">{message.content}</p>; }
                        })()
                      )}
                      <p className={clsx("text-[10px] mt-1", isOwnMessage ? "text-white/60" : "text-gray-400")}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

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
      <div className="p-4 border-t border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-[#1A1D21]/80 backdrop-blur-xl">
        <div className="flex items-end gap-2">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors relative">
            <Plus size={20} className="text-gray-600 dark:text-gray-300" onClick={() => setShowAttachMenu(!showAttachMenu)} />
            {showAttachMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="absolute bottom-12 left-0 bg-white dark:bg-[#1A1D21] rounded-xl shadow-lg border border-gray-200/50 dark:border-white/10 p-2 min-w-[120px]">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" id="image-upload" />
                <label htmlFor="image-upload" className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg cursor-pointer text-sm">
                  <Image size={16} /> 图片
                </label>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-sm">
                  <File size={16} /> 文件
                </button>
              </motion.div>
            )}
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入消息..."
              className="w-full h-11 px-4 bg-gray-100 dark:bg-[#0E1116] rounded-full outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>
          <button onClick={handleSend} disabled={!input.trim()} className="p-2.5 bg-[#007AFF] hover:bg-[#006CE0] disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors">
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
