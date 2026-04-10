import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Info, Plus, Send, Image, File, X, AlertTriangle, ShieldAlert, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { useWebSocket } from '../../hooks/useWebSocket';
import { tempConversationApi } from '../../api/tempConversation';
import { messageApi } from '../../api/message';
import { uploadApi } from '../../api/upload';
import { GroupInfoSidebar } from '../components/GroupInfoSidebar';
import { useIsMobile } from '../components/ui/use-mobile';

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
  const [isTempConversation, setIsTempConversation] = useState(false);
  const [showAntiFraudTip, setShowAntiFraudTip] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [messageMenuPos, setMessageMenuPos] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, token } = useAuthStore();
  const { conversations, fetchConversations } = useChatStore();
  const { toast, ToastContainer } = useToast();
  const isMobile = useIsMobile();

  const conversation = conversations.find(c => c.id === conversationId);

  useWebSocket(conversationId || undefined, (newMessage) => {
    setMessages(prev => {
      if (prev.some(m => m.id === newMessage.id)) {
        return prev;
      }
      return [...prev, newMessage];
    });
  });

  useEffect(() => {
    if (conversationId && token) {
      loadMessages();
      markAsRead();
      setTimeout(() => checkTempConversation(), 1000);
    }
  }, [conversationId, token]);

  const checkTempConversation = async () => {
    if (!conversationId || !token) return;
    try {
      const result = await tempConversationApi.check(conversationId);
      setIsTempConversation(result.isTemp);
      if (result.isTemp) {
        setShowAntiFraudTip(true);
        setTimeout(() => setShowAntiFraudTip(false), 5000);
        const otherUser = conversation?.members?.find((m: any) => m.id !== user?.id);
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

  const loadMessages = async () => {
    if (!conversationId || !token) {
      return;
    }
    setIsLoading(true);
    try {
      const timestamp = Date.now();
      const url = `${API_BASE_URL}/message/list?conversationId=${conversationId}&t=${timestamp}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        console.error('消息加载失败，状态码:', response.status);
        setMessages([]);
        return;
      }

      const data = await response.json();

      if (data.code === 200 && Array.isArray(data.data)) {
        setMessages(data.data || []);
      } else {
        console.error('消息加载失败:', data.msg);
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
        toast(`⛔ ${data.data.details || '消息被拦截'}`, 'warning');
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        toast(data.msg || '发送失败', 'error');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
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
        const uploadRes = await uploadApi.uploadImage(base64);
        if (uploadRes.code !== 200 || !uploadRes.data?.url) {
          toast(uploadRes.msg || '图片上传失败', 'error');
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

        if ((data.code === 200 || data.code === 201) && data.data) {
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
      <div className={isMobile ? "h-12 px-3 flex items-center justify-between border-b border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-[#1A1D21]/80 backdrop-blur-xl" : "h-14 px-4 flex items-center justify-between border-b border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-[#1A1D21]/80 backdrop-blur-xl"}>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => navigate(isMobile ? '/' : '/')} className={isMobile ? "p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors" : "p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"}>
            <ArrowLeft size={isMobile ? 18 : 20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h2 className={isMobile ? "font-semibold text-gray-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5" : "font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2"}>
              {isGroupChat && <Users size={isMobile ? 14 : 16} className="text-[#007AFF]" />}
              {conversation?.name || '聊天'}
              {isTempConversation && <AlertTriangle size={isMobile ? 12 : 14} className="text-yellow-500" />}
            </h2>
            <p className={isMobile ? "text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 hidden sm:block" : "text-xs text-gray-500 dark:text-gray-400"}>
              {(conversation?.members?.length || 0)} 位成员
            </p>
          </div>
        </div>
        {isGroupChat ? (
          <button
            onClick={() => setShowGroupInfo(true)}
            className={isMobile ? "p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors" : "p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"}
          >
            <Users size={isMobile ? 18 : 20} className="text-gray-600 dark:text-gray-300" />
          </button>
        ) : (
          <button className={isMobile ? "p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors" : "p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"}>
            <Info size={isMobile ? 18 : 20} className="text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>

      {/* Temp Conversation Warning Banner */}
      {isTempConversation && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-700/30 px-4 py-2">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 text-xs">
            <ShieldAlert size={14} />
            <span>临时会话，请注意保护个人信息和财产安全，谨防诈骗！</span>
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
                <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">安全提示</h4>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 leading-relaxed">
                  这是一个临时会话对象，双方不是好友关系。请务必保护好您的个人信息，不要向陌生人透露手机号、银行卡、密码等敏感信息。如遇诈骗行为，请及时举报。
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
                const isRecalled = message.type === 'recalled';
                return (
                  <motion.div
                    key={message.id || Math.random()}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onLongPress={() => {
                      if (isOwnMessage && !isRecalled) {
                        setSelectedMessage(message);
                        setShowMessageMenu(true);
                      }
                    }}
                    onClick={() => {
                      if (isOwnMessage && !isRecalled) {
                        setSelectedMessage(message);
                        setShowMessageMenu(true);
                      }
                    }}
                    className={clsx("flex mb-3", isOwnMessage ? "justify-end" : "justify-start")}
                  >
                    {!isOwnMessage && !isRecalled && (
                      <div className={isMobile ? "w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center text-white text-[10px] sm:text-xs font-semibold mr-1.5 sm:mr-2 flex-shrink-0" : "w-8 h-8 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center text-white text-xs font-semibold mr-2 flex-shrink-0"}>
                        {(message.sender_nickname || 'U')[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className={clsx(isMobile ? "max-w-[75%] sm:max-w-[70%] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2" : "max-w-[70%] rounded-2xl px-4 py-2",
                      isRecalled ? "bg-gray-200 dark:bg-gray-800 text-gray-500" :
                      isOwnMessage ? "bg-[#007AFF] text-white" : "bg-white dark:bg-[#1A1D21] text-gray-900 dark:text-white"
                    )}>
                      {message.type === 'text' && <p className={isMobile ? "text-[13px] sm:text-sm" : "text-sm"}>{message.content}</p>}
                      {message.type === 'image' && !isRecalled && <img src={message.content} alt="图片" className={isMobile ? "rounded-lg max-w-[200px] sm:max-w-full" : "rounded-lg max-w-full"} />}
                      {message.type === 'recalled' && (
                        <p className={isMobile ? "text-[13px] sm:text-sm italic opacity-60" : "text-sm italic opacity-60"}>{message.content}</p>
                      )}
                      {message.type === 'file' && !isRecalled && (
                        (() => {
                          try {
                            const fileData = JSON.parse(message.content || '{}');
                            return (
                              <div className="flex items-center gap-2">
                                <File size={isMobile ? 14 : 16} />
                                <span className={isMobile ? "text-[13px] sm:text-sm" : "text-sm"}>{fileData.name || '未知文件'}</span>
                              </div>
                            );
                          } catch { return <p className={isMobile ? "text-[13px] sm:text-sm" : "text-sm"}>{message.content}</p>; }
                        })()
                      )}
                      <p className={clsx(isMobile ? "text-[9px] sm:text-[10px] mt-0.5" : "text-[10px] mt-1", isOwnMessage ? "text-white/60" : "text-gray-400", message.status === 'pending' && "flex items-center gap-1")}>
                        {message.status === 'pending' && (
                          <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        )}
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

      {/* Message Menu */}
      <AnimatePresence>
        {showMessageMenu && selectedMessage && (
          <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMessageMenu(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className={isMobile ? "relative w-full bg-white dark:bg-[#1A1D21] rounded-t-2xl p-4 shadow-2xl" : "relative w-full max-w-xs bg-white dark:bg-[#1A1D21] rounded-2xl shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden"}
            >
              <button
                onClick={async () => {
                  try {
                    const res = await messageApi.recallMessage(selectedMessage.id);
                    if (res.code === 200) {
                      setMessages(prev => prev.map(m =>
                        m.id === selectedMessage.id
                          ? { ...m, type: 'recalled', content: '此消息已撤回' }
                          : m
                      ));
                      fetchConversations();
                      toast('已撤回', 'success');
                    } else {
                      toast(res.msg || '撤回失败', 'error');
                    }
                  } catch {
                    toast('撤回失败', 'error');
                  }
                  setShowMessageMenu(false);
                }}
                className="w-full px-5 py-3.5 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                撤回消息
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedMessage.content);
                  toast('已复制', 'success');
                  setShowMessageMenu(false);
                }}
                className="w-full px-5 py-3.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border-t border-gray-100 dark:border-white/10"
              >
                复制
              </button>
              <button
                onClick={async () => {
                  try {
                    const conversations = await import('../../api/conversation').then(m => m.conversationApi.getList());
                    if (conversations.code === 200) {
                      const targets = conversations.data.filter((c: any) => c.id !== conversationId);
                      if (targets.length === 0) {
                        toast('没有其他会话可转发', 'warning');
                        setShowMessageMenu(false);
                        return;
                      }
                      const target = targets[0];
                      await messageApi.sendMessage({
                        conversationId: target.id,
                        content: selectedMessage.content,
                        type: selectedMessage.type
                      });
                      toast('已转发', 'success');
                    }
                  } catch {
                    toast('转发失败', 'error');
                  }
                  setShowMessageMenu(false);
                }}
                className="w-full px-5 py-3.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border-t border-gray-100 dark:border-white/10"
              >
                转发
              </button>
              <button
                onClick={() => setShowMessageMenu(false)}
                className="w-full px-5 py-3.5 text-left text-sm text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border-t border-gray-100 dark:border-white/10"
              >
                取消
              </button>
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
                  <Image size={16} /> 图片
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
              placeholder="输入消息..."
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

      <GroupInfoSidebar
        groupId={conversationId}
        isOpen={showGroupInfo}
        onClose={() => setShowGroupInfo(false)}
      />

      <ToastContainer />
    </div>
  );
}
