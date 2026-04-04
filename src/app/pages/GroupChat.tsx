import { useParams } from "react-router";
import { MoreHorizontal, Plus, Paperclip, BarChart2, Smile, Mic, Phone, Video, Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";

const GROUP_MESSAGES = [
  { id: "1", sender: "Alex", role: "Admin", text: "Welcome everyone to the new Design Team chat! 🎉", time: "09:00 AM", isMe: false, avatar: "https://images.unsplash.com/photo-1609231443127-7e1e4c672ece?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMG1hbiUyMGNvbmZpZGVudHxlbnwxfHx8fDE3NzUyODAxMjB8MA&ixlib=rb-4.1.0&q=80&w=1080" },
  { id: "2", sender: "Sarah", role: "Member", text: "Hey! Glad to be here.", time: "09:05 AM", isMe: false, avatar: "https://images.unsplash.com/photo-1643816831186-b2427a8f9f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMHdvbWFuJTIwcG9ydHJhaXQlMjBzbWlsaW5nfGVufDF8fHx8MTc3NTI4MDEyMHww&ixlib=rb-4.1.0&q=80&w=1080" },
  { id: "3", sender: "You", role: "Member", text: "Are we reviewing the prototypes today?", time: "09:10 AM", isMe: true },
  { id: "4", sender: "Alex", role: "Admin", text: "@You Yes, the new Figma file is ready.", time: "09:15 AM", isMe: false, avatar: "https://images.unsplash.com/photo-1609231443127-7e1e4c672ece?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMG1hbiUyMGNvbmZpZGVudHxlbnwxfHx8fDE3NzUyODAxMjB8MA&ixlib=rb-4.1.0&q=80&w=1080" },
];

export function GroupChat() {
  const { id } = useParams();
  const [messages, setMessages] = useState(GROUP_MESSAGES);
  const [input, setInput] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), sender: "You", role: "Member", text: input, time: "Now", isMe: true }]);
    setInput("");
  };

  const renderTextWithMentions = (text: string) => {
    return text.split(/(@\w+)/g).map((part, i) => {
      if (part.startsWith("@")) {
        return <span key={i} className="text-[#007AFF] font-medium bg-[#007AFF]/10 dark:bg-[#007AFF]/20 px-1 rounded-sm">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFC] dark:bg-[#0A0C10] relative">
      {/* Background Decor */}
      <div className="absolute top-[30%] left-[10%] w-[400px] h-[400px] bg-indigo-100/30 dark:bg-indigo-900/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header - Desktop */}
      <div className="sticky top-0 z-40 bg-white/70 dark:bg-[#13161A]/70 backdrop-blur-3xl pt-6 pb-4 px-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.01)]">
        <div className="flex items-center gap-4 cursor-pointer group">
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1744943776128-dcaba0435d9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncm91cCUyMG9mJTIwZnJpZW5kcyUyMGxhdWdoaW5nfGVufDF8fHx8MTc3NTIyNjgzMHww&ixlib=rb-4.1.0&q=80&w=1080" alt="Group" className="w-11 h-11 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform" />
          </div>
          <div className="flex flex-col">
            <span className="text-[17px] font-semibold text-black dark:text-white leading-tight">Design Team</span>
            <span className="text-[13px] text-black/40 dark:text-white/40 mt-0.5">12 Members • 4 Online</span>
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
            <MoreHorizontal size={20} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6 relative z-10 scrollbar-hide">
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
          {messages.map((msg, index) => {
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={clsx(
                  "flex max-w-[70%]",
                  msg.isMe ? "self-end justify-end" : "self-start justify-start gap-3"
                )}
              >
                {!msg.isMe && (
                  <img src={msg.avatar} alt={msg.sender} className="w-9 h-9 rounded-full object-cover mt-auto mb-5 shadow-sm" />
                )}
                <div className={clsx("flex flex-col", msg.isMe ? "items-end" : "items-start")}>
                  {!msg.isMe && (
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      <span className="text-[13px] font-semibold text-black/60 dark:text-white/60">{msg.sender}</span>
                      {msg.role === "Admin" && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#007AFF] bg-[#007AFF]/10 px-1.5 py-0.5 rounded-sm">Admin</span>
                      )}
                    </div>
                  )}
                  <div
                    className={clsx(
                      "px-4 py-3 rounded-[20px] text-[15px] leading-[1.5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] backdrop-blur-md",
                      msg.isMe
                        ? "bg-gradient-to-tr from-[#007AFF] to-[#5AC8FA] text-white rounded-br-sm border border-white/20 dark:border-white/5"
                        : "bg-white/90 dark:bg-[#23272D]/90 text-black dark:text-white rounded-bl-sm border border-black/5 dark:border-white/5"
                    )}
                  >
                    {renderTextWithMentions(msg.text)}
                  </div>
                  <span className="text-[12px] text-black/30 dark:text-white/30 mt-1.5 px-1 font-medium">
                    {msg.time}
                  </span>
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Attach Menu */}
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

      {/* Bottom Input Bar - Desktop */}
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
