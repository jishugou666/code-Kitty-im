import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Info, Plus, Smile, Mic, Phone, Video, Send, Image, File, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';

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

  const conversation = conversations.find(c => c.id === conversationId);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId && conversation?.messages) {
      setMessages(conversation.messages);
    }
  }, [conversation?.messages]);

  const loadMessages = async () => {
    if (!conversationId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/message/list?conversationId=${conversationId}`, {
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
          const response = await fetch('http://localhost:3000/api/message/send', {
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setPreviewImage(base64);

        try {
          const response = await fetch('http://localhost:3000/api/message/send', {
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
          if (data.code === 200) {
            setMessages(prev => [...prev, data.data]);
            fetchConversations();
          }
        } catch (error) {
          console.error('Failed to send image:', error);
        } finally {
          setPreviewImage(null);
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert('Only image files are supported in this demo');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowAttachMenu(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const fileName = file.name;

      try {
        const response = await fetch('http://localhost:3000/api/message/send', {
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
        if (data.code === 200) {
          setMessages(prev => [...prev, data.data]);
          fetchConversations();
        }
      } catch (error) {
        console.error('Failed to send file:', error);
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowAttachMenu(false);
  };

  const formatTime = (timeStr: string | undefined) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getOtherUser = () => {
    if (conversation?.type === 'single' && conversation?.members) {
      return conversation.members.find((m: any) => m.id !== user?.id) || { nickname: 'Unknown', avatar: '', status: 0 };
    }
    return { nickname: conversation?.name || 'Chat', avatar: conversation?.avatar || '', status: 0 };
  };

  const otherUser = getOtherUser();

  const renderMessageContent = (msg: any) => {
    if (msg.type === 'image') {
      return (
        <a href={msg.content} target="_blank" rel="noopener noreferrer" className="block max-w-[300px]">
          <img src={msg.content} alt="Image" className="max-w-full rounded-lg" loading="lazy" />
        </a>
      );
    }
    if (msg.type === 'file') {
      try {
        const fileData = JSON.parse(msg.content);
        return (
          <a href={fileData.data} download={fileData.name} className="flex items-center gap-2 p-2 bg-black/10 dark:bg-white/10 rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-colors">
            <File size={20} className="text-[#007AFF]" />
            <span className="text-sm truncate max-w-[200px]">{fileData.name}</span>
          </a>
        );
      } catch {
        return <span>{msg.content}</span>;
      }
    }
    return <span>{msg.content}</span>;
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFC] dark:bg-[#0A0C10] relative">
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sticky top-0 z-40 bg-white/70 dark:bg-[#13161A]/70 backdrop-blur-3xl pt-6 pb-4 px-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.01)]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-black dark:text-white" />
          </button>
          <div className="relative cursor-pointer">
            {otherUser.avatar ? (
              <img src={otherUser.avatar} alt={otherUser.nickname} className="w-11 h-11 rounded-full object-cover shadow-sm" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-[#007AFF] flex items-center justify-center text-white font-semibold">
                {otherUser.nickname.charAt(0).toUpperCase()}
              </div>
            )}
            {otherUser.status === 1 && (
              <div className="absolute bottom-0 right-0 w-[12px] h-[12px] bg-[#34C759] border-2 border-white dark:border-[#13161A] rounded-full" />
            )}
          </div>
          <div className="flex flex-col cursor-pointer">
            <span className="text-[17px] font-semibold text-black dark:text-white leading-tight">{otherUser.nickname}</span>
            <span className="text-[13px] text-black/40 dark:text-white/40 mt-0.5">
              {otherUser.status === 1 ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2.5 text-black/40 hover:text-[#007AFF] dark:text-white/40 dark:hover:text-[#007AFF] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <Phone size={20} strokeWidth={2} />
          </button>
          <button className="p-2.5 text-black/40 hover:text-[#007AFF] dark:text-white/40 dark:hover:text-[#007AFF] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <Video size={20} strokeWidth={2} />
          </button>
          <div className="w-[1px] h-6 bg-black/10 dark:bg-white/10 mx-1" />
          <button className="p-2.5 text-black/40 hover:text-[#007AFF] dark:text-white/40 dark:hover:text-[#007AFF] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <Info size={20} strokeWidth={2} />
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        className="hidden"
      />

      <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6 relative z-10 scrollbar-hide">
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-5">
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-black/40 dark:text-white/40 text-sm">
              <p>No messages yet</p>
              <p className="text-xs mt-1">Send a message to start the conversation!</p>
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
                  "flex flex-col max-w-[65%]",
                  isMe ? "self-end items-end" : "self-start items-start"
                )}
              >
                <div
                  className={clsx(
                    "px-4 py-2.5 rounded-[20px] text-[15px] leading-[1.5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] backdrop-blur-md",
                    isMe
                      ? "bg-gradient-to-tr from-[#007AFF] to-[#5AC8FA] text-white rounded-tr-sm border border-white/20 dark:border-white/5"
                      : "bg-white/90 dark:bg-[#23272D]/90 text-black dark:text-white rounded-tl-sm border border-black/5 dark:border-white/5"
                  )}
                >
                  {renderMessageContent(msg)}
                </div>
                <span className="text-[12px] text-black/30 dark:text-white/30 mt-1.5 px-1 font-medium">
                  {formatTime(msg.created_at)}
                </span>
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
            className="absolute bottom-[90px] left-1/2 -translate-x-1/2 w-[280px] bg-white/90 dark:bg-[#1A1D21]/90 backdrop-blur-2xl rounded-[24px] p-4 flex justify-around shadow-[0_16px_48px_rgba(0,0,0,0.1)] border border-white/40 dark:border-white/10 z-30"
          >
            <button
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center text-[#007AFF] group-hover:scale-110 transition-transform shadow-sm">
                <Image size={22} />
              </div>
              <span className="text-[11px] font-medium text-black/60 dark:text-white/60">Image</span>
            </button>
            <button
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform shadow-sm">
                <File size={22} />
              </div>
              <span className="text-[11px] font-medium text-black/60 dark:text-white/60">File</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pb-8 pt-4 px-8 bg-white/70 dark:bg-[#13161A]/70 backdrop-blur-3xl border-t border-black/5 dark:border-white/5 flex justify-center z-40">
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
              placeholder="Write a message..."
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
