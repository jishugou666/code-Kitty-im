import { useParams } from "react-router";
import { Info, Plus, Smile, Mic, Phone, Video, Send } from "lucide-react";
import { motion } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";

const MESSAGES = [
  { id: "1", text: "Hey! How are you doing?", sender: "them", time: "10:30 AM" },
  { id: "2", text: "I'm good! Just finished working on the new UI.", sender: "me", time: "10:32 AM" },
  { id: "3", text: "That's awesome. Can't wait to see it.", sender: "them", time: "10:35 AM" },
  { id: "4", text: "I'll send over the prototype link shortly.", sender: "me", time: "10:36 AM" },
  { id: "5", text: "Perfect. We can review it in the afternoon meeting.", sender: "them", time: "10:40 AM" },
  { id: "6", text: "Hey, are we still on for tonight?", sender: "them", time: "10:42 AM" },
];

export function Chat() {
  const { id } = useParams();
  const [messages, setMessages] = useState(MESSAGES);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), text: input, sender: "me", time: "Now" }]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFC] dark:bg-[#0A0C10] relative">
      {/* Background Decor */}
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header - Frosted Glass Desktop */}
      <div className="sticky top-0 z-40 bg-white/70 dark:bg-[#13161A]/70 backdrop-blur-3xl pt-6 pb-4 px-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.01)]">
        <div className="flex items-center gap-4">
          <div className="relative cursor-pointer">
            <img src="https://images.unsplash.com/photo-1594318223885-20dc4b889f9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHdvbWFuJTIwc21pbGV8ZW58MXx8fHwxNzc1MjMyMDcxfDA&ixlib=rb-4.1.0&q=80&w=1080" alt="Avatar" className="w-11 h-11 rounded-full object-cover shadow-sm" />
            <div className="absolute bottom-0 right-0 w-[12px] h-[12px] bg-[#34C759] border-2 border-white dark:border-[#13161A] rounded-full" />
          </div>
          <div className="flex flex-col cursor-pointer">
            <span className="text-[17px] font-semibold text-black dark:text-white leading-tight">Emma Watson</span>
            <span className="text-[13px] text-black/40 dark:text-white/40 mt-0.5">Online</span>
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6 relative z-10 scrollbar-hide">
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-5">
          {messages.map((msg, index) => {
            const isMe = msg.sender === "me";
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
                  {msg.text}
                </div>
                <span className="text-[12px] text-black/30 dark:text-white/30 mt-1.5 px-1 font-medium">
                  {msg.time}
                </span>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Input Bar - Desktop */}
      <div className="pb-8 pt-4 px-8 bg-white/70 dark:bg-[#13161A]/70 backdrop-blur-3xl border-t border-black/5 dark:border-white/5 flex justify-center z-40">
        <div className="max-w-4xl w-full flex items-end gap-3">
          <button className="p-3 text-black/40 hover:text-[#007AFF] dark:text-white/40 dark:hover:text-[#007AFF] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors flex-shrink-0">
            <Plus size={24} strokeWidth={2.5} />
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
