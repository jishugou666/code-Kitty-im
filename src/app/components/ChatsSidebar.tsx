import { useNavigate, useParams } from "react-router";
import { Search, Edit, CheckCheck } from "lucide-react";
import { motion } from "motion/react";
import { clsx } from "clsx";

const CHATS = [
  {
    id: "1",
    name: "Emma Watson",
    avatar: "https://images.unsplash.com/photo-1594318223885-20dc4b889f9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHdvbWFuJTIwc21pbGV8ZW58MXx8fHwxNzc1MjMyMDcxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    lastMessage: "Hey, are we still on for tonight?",
    time: "10:42 AM",
    unread: 2,
    online: true,
    isGroup: false,
  },
  {
    id: "group1",
    name: "Design Team",
    avatar: "https://images.unsplash.com/photo-1744943776128-dcaba0435d9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncm91cCUyMG9mJTIwZnJpZW5kcyUyMGxhdWdoaW5nfGVufDF8fHx8MTc3NTIyNjgzMHww&ixlib=rb-4.1.0&q=80&w=1080",
    lastMessage: "Alex: The new Figma file is ready",
    time: "09:15 AM",
    unread: 0,
    online: false,
    isGroup: true,
  },
  {
    id: "2",
    name: "Michael Chen",
    avatar: "https://images.unsplash.com/photo-1609231443127-7e1e4c672ece?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMG1hbiUyMGNvbmZpZGVudHxlbnwxfHx8fDE3NzUyODAxMjB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    lastMessage: "Thanks for the update!",
    time: "Yesterday",
    unread: 0,
    online: true,
    isGroup: false,
  },
  {
    id: "3",
    name: "Sarah Lee",
    avatar: "https://images.unsplash.com/photo-1643816831186-b2427a8f9f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMHdvbWFuJTIwcG9ydHJhaXQlMjBzbWlsaW5nfGVufDF8fHx8MTc3NTI4MDEyMHww&ixlib=rb-4.1.0&q=80&w=1080",
    lastMessage: "Can you send me the link?",
    time: "Yesterday",
    unread: 1,
    online: false,
    isGroup: false,
  },
  {
    id: "4",
    name: "David Kim",
    avatar: "https://images.unsplash.com/photo-1762522921456-cdfe882d36c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHByb2Zlc3Npb25hbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NTI1MjQ2OHww&ixlib=rb-4.1.0&q=80&w=1080",
    lastMessage: "See you tomorrow ✌️",
    time: "Monday",
    unread: 0,
    online: false,
    isGroup: false,
  },
  {
    id: "5",
    name: "Jessica Taylor",
    avatar: "https://images.unsplash.com/photo-1624303966826-260632059640?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGd1eSUyMGNhc3VhbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NTI4MDEyMHww&ixlib=rb-4.1.0&q=80&w=1080",
    lastMessage: "I'll call you later.",
    time: "Sunday",
    unread: 0,
    online: true,
    isGroup: false,
  },
];

export function ChatsSidebar() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-white/60 dark:bg-[#13161A]/60 backdrop-blur-3xl pt-8 pb-4 px-4 border-b border-black/5 dark:border-white/5 flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-xl font-semibold text-black dark:text-white tracking-tight">Messages</h1>
          <button className="text-black/40 hover:text-[#007AFF] dark:text-white/40 dark:hover:text-[#007AFF] transition-colors bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 p-2 rounded-full">
            <Edit size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={16} className="text-black/30 dark:text-white/30 group-focus-within:text-[#007AFF] transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search messages"
            className="w-full h-[38px] pl-9 pr-4 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-[15px] text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:bg-white dark:focus:bg-[#1A1D21] focus:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:focus:shadow-[0_4px_16px_rgba(0,0,0,0.2)] focus:border-[#007AFF]/30 border border-transparent transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-3 scrollbar-hide">
        {CHATS.map((chat, index) => {
          const isActive = id === chat.id;
          return (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(chat.isGroup ? `/group/${chat.id}` : `/chat/${chat.id}`)}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 mx-2 rounded-[14px] cursor-pointer transition-all duration-200 relative mb-1",
                isActive
                  ? "bg-[#007AFF] text-white shadow-[0_4px_16px_rgba(0,122,255,0.25)]"
                  : "hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white"
              )}
            >
              <div className="relative flex-shrink-0">
                <img src={chat.avatar} alt={chat.name} className="w-[46px] h-[46px] rounded-full object-cover shadow-sm" />
                {chat.online && !chat.isGroup && (
                  <div className={clsx(
                    "absolute bottom-0 right-0 w-[12px] h-[12px] rounded-full border-2",
                    isActive ? "bg-[#34C759] border-[#007AFF]" : "bg-[#34C759] border-white dark:border-[#13161A]"
                  )} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h2 className={clsx("text-[15px] font-semibold truncate pr-2", isActive ? "text-white" : "text-black dark:text-white")}>
                    {chat.name}
                  </h2>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {chat.unread === 0 && (
                      <CheckCheck size={14} className={isActive ? "text-white/70" : "text-[#007AFF] opacity-80"} />
                    )}
                    <span className={clsx("text-[12px]", isActive ? "text-white/70" : "text-black/40 dark:text-white/40")}>
                      {chat.time}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <p className={clsx("text-[13px] truncate tracking-tight", isActive ? "text-white/80" : "text-black/50 dark:text-white/50")}>
                    {chat.lastMessage}
                  </p>
                  {chat.unread > 0 && (
                    <div className={clsx(
                      "w-[18px] h-[18px] flex-shrink-0 rounded-full flex items-center justify-center",
                      isActive ? "bg-white" : "bg-[#007AFF]"
                    )}>
                      <span className={clsx("text-[11px] font-bold leading-none", isActive ? "text-[#007AFF]" : "text-white")}>
                        {chat.unread}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
